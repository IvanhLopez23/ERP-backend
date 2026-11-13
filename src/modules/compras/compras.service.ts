import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { Compra } from './entities/compra.entity';
import { DetalleCompra } from './entities/detalle-compra.entity';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateEstatusCompraDto } from './dto/update-estatus-compra.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { ProductosService } from '../almacen/productos.service';
import { InventarioService } from '../almacen/inventario.service';
import { Almacen } from '../almacen/entities/almacen.entity';
import { CxpService } from '../contabilidad/cxp.service';
import { FoliosService } from '../contabilidad/folios.service';
import { CentrosCostoService } from '../contabilidad/centros-costo.service';

@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
    @InjectRepository(Compra)
    private readonly compraRepository: Repository<Compra>,
    private readonly productosService: ProductosService,
    private readonly inventarioService: InventarioService,
    private readonly cxpService: CxpService,
    private readonly foliosService: FoliosService,
    private readonly centrosCostoService: CentrosCostoService,
    private readonly dataSource: DataSource,
  ) {}

  // ==================== PROVEEDORES ====================

  async crearProveedor(dto: CreateProveedorDto) {
    try {
      const existe = await this.proveedorRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (existe) {
        throw new BadRequestException(
          `El proveedor con código ${dto.codigo} ya existe`,
        );
      }
      const data = this.proveedorRepository.create(dto);
      return await this.proveedorRepository.save(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarProveedores() {
    return await this.proveedorRepository.find({ order: { id: 'DESC' } });
  }

  async paginarProveedores(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) {
      where.nombre = ILike(`%${buscar}%`);
    }
    const data = await this.proveedorRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      order: { id: 'DESC' },
    });
    const total = await this.proveedorRepository.count({ where });
    return { total, data };
  }

  async buscarProveedorPorId(publicId: string) {
    const item = await this.proveedorRepository.findOne({
      where: { publicId },
    });
    if (!item)
      throw new BadRequestException(`El proveedor ${publicId} no existe`);
    return item;
  }

  async actualizarProveedor(publicId: string, dto: UpdateProveedorDto) {
    const item = await this.proveedorRepository.findOne({
      where: { publicId },
    });
    if (!item)
      throw new BadRequestException(`El proveedor ${publicId} no existe`);
    if (dto.codigo) {
      const duplicado = await this.proveedorRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (duplicado && duplicado.id !== item.id) {
        throw new BadRequestException(`El código ${dto.codigo} ya está en uso`);
      }
    }
    await this.proveedorRepository.update(item.id, dto);
    return { msg: 'Proveedor actualizado exitosamente' };
  }

  async activarDesactivarProveedor(publicId: string) {
    const item = await this.proveedorRepository.findOne({
      where: { publicId },
    });
    if (!item)
      throw new BadRequestException(`El proveedor ${publicId} no existe`);
    await this.proveedorRepository.update(item.id, { activo: !item.activo });
    return {
      msg: `Proveedor ${!item.activo ? 'activado' : 'desactivado'} correctamente`,
    };
  }

  // ==================== COMPRAS ====================

  async crearCompra(dto: CreateCompraDto, usuarioId: number) {
    try {
      const proveedor = await this.proveedorRepository.findOne({
        where: { publicId: dto.proveedorId },
      });
      if (!proveedor)
        throw new BadRequestException(
          `El proveedor ${dto.proveedorId} no existe`,
        );
      if (!proveedor.activo)
        throw new BadRequestException('El proveedor está desactivado');

      const almacen = await this.dataSource
        .getRepository(Almacen)
        .findOne({ where: { publicId: dto.almacenId, activo: true } });
      if (!almacen)
        throw new BadRequestException(
          `El almacén ${dto.almacenId} no existe o está inactivo`,
        );

      let centroCostoId: number | null = null;
      if (dto.centroCostoId) {
        const centro = await this.centrosCostoService.buscarPorId(
          dto.centroCostoId,
        );
        if (!centro.activo) {
          throw new BadRequestException(
            `El centro de costo ${centro.codigo} está inactivo`,
          );
        }
        centroCostoId = centro.id;
      }

      let subtotal = 0;
      const detallesDto = await Promise.all(
        dto.detalles.map(async (det) => {
          const producto = await this.productosService.buscarProductoPorId(
            det.productoId,
          );
          const subt = det.cantidad * det.precioUnitario;
          subtotal += subt;
          return { ...det, productoId: producto.id, subtotal: subt };
        }),
      );

      const iva = subtotal * 0.16;
      const total = subtotal + iva;

      const compraId = await this.dataSource.transaction(async (manager) => {
        const folio = await this.foliosService.siguiente('compra', {}, manager);
        const compraRepo = manager.getRepository(Compra);
        const compra = compraRepo.create({
          folio: `CMP-${this.fechaFolio()}-${String(folio).padStart(4, '0')}`,
          proveedorId: proveedor.id,
          almacen,
          fechaCompra: new Date(dto.fechaCompra),
          subtotal,
          iva,
          total,
          estatus: 'pendiente',
          observaciones: dto.observaciones,
          centroCostoId,
          usuarioId,
        });
        const compraGuardada = await compraRepo.save(compra);

        const detalleRepo = manager.getRepository(DetalleCompra);
        await detalleRepo.save(
          detallesDto.map((det) => ({
            ...det,
            compraId: compraGuardada.id,
          })),
        );

        await this.cxpService.crearDesdeCompra(
          compraGuardada,
          usuarioId,
          manager,
        );
        return compraGuardada.id;
      });

      return await this.compraRepository.findOne({
        where: { id: compraId },
        relations: {
          proveedor: true,
          almacen: true,
          centroCosto: true,
          detalles: {
            producto: true,
          },
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private fechaFolio() {
    const fecha = new Date();
    return `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}`;
  }

  async buscarCompras() {
    return await this.compraRepository.find({
      relations: {
        proveedor: true,
        almacen: true,
        centroCosto: true,
        detalles: {
          producto: true,
        },
      },
      order: { id: 'DESC' },
    });
  }

  async listarAlmacenesActivos() {
    return await this.dataSource.getRepository(Almacen).find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async paginarCompras(paginacionDto: PaginacionDto, proveedorId?: string) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (proveedorId) {
      const proveedor = await this.buscarProveedorPorId(proveedorId);
      where.proveedorId = proveedor.id;
    }
    if (buscar) {
      where.folio = ILike(`%${buscar}%`);
    }
    const data = await this.compraRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: {
        proveedor: true,
        almacen: true,
        centroCosto: true,
        detalles: {
          producto: true,
        },
      },
      order: { id: 'DESC' },
    });
    const total = await this.compraRepository.count({ where });
    return { total, data };
  }

  async buscarCompraPorId(publicId: string) {
    const item = await this.compraRepository.findOne({
      where: { publicId },
      relations: {
        proveedor: true,
        almacen: true,
        centroCosto: true,
        detalles: {
          producto: {
            unidadMedida: true,
          },
        },
      },
    });
    if (!item) throw new BadRequestException(`La compra ${publicId} no existe`);
    return item;
  }

  async actualizarEstatusCompra(
    publicId: string,
    dto: UpdateEstatusCompraDto,
    usuarioId: number,
  ) {
    const compra = await this.compraRepository.findOne({
      where: { publicId },
      relations: {
        detalles: true,
        almacen: true,
      },
    });
    if (!compra)
      throw new BadRequestException(`La compra ${publicId} no existe`);

    if (dto.estatus === compra.estatus) {
      throw new BadRequestException(
        `La compra ya está en estatus ${dto.estatus}`,
      );
    }

    if (compra.estatus === 'cancelada') {
      throw new BadRequestException(
        'No se puede cambiar el estatus de una compra cancelada',
      );
    }

    if (compra.estatus === 'recibida' && dto.estatus !== 'cancelada') {
      throw new BadRequestException(
        'La compra ya fue recibida, solo se puede cancelar',
      );
    }

    const almacenId = compra.almacen?.id;
    if (!almacenId) {
      throw new BadRequestException(
        'La compra no tiene un almacén de destino asignado',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      if (dto.estatus === 'recibida') {
        for (const detalle of compra.detalles) {
          await this.inventarioService.actualizarInventario(
            detalle.productoId,
            almacenId,
            Number(detalle.cantidad),
            'entrada',
            compra.folio,
            `Entrada por compra ${compra.folio}`,
            usuarioId,
            manager,
          );
        }
      }

      if (dto.estatus === 'cancelada' && compra.estatus === 'recibida') {
        for (const detalle of compra.detalles) {
          await this.inventarioService.actualizarInventario(
            detalle.productoId,
            almacenId,
            Number(detalle.cantidad),
            'salida',
            compra.folio,
            `Reverso por cancelación de compra ${compra.folio}`,
            usuarioId,
            manager,
          );
        }
      }

      await manager
        .getRepository(Compra)
        .update(compra.id, { estatus: dto.estatus });
      if (dto.estatus === 'cancelada') {
        await this.cxpService.cancelarPorCompra(compra.id, usuarioId, manager);
      }
    });

    return {
      msg: `Compra ${dto.estatus === 'recibida' ? 'recibida' : dto.estatus === 'cancelada' ? 'cancelada' : 'actualizada'} exitosamente`,
    };
  }
}
