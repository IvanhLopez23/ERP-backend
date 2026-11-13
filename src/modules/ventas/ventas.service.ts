import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { Cotizacion } from './entities/cotizacion.entity';
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';
import { Empleado } from '../rh/entities/empleado.entity';
import { Producto } from '../almacen/entities/producto.entity';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateEstatusVentaDto } from './dto/update-estatus-venta.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { InventarioService } from '../almacen/inventario.service';
import { CxcService } from '../contabilidad/cxc.service';
import { IntegracionContableService } from '../contabilidad/integracion-contable.service';
import { FoliosService } from '../contabilidad/folios.service';
import { CentrosCostoService } from '../contabilidad/centros-costo.service';
import { calcularDetalles } from './helpers/calcular-detalles';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Cotizacion)
    private readonly cotizacionRepository: Repository<Cotizacion>,
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
    @InjectRepository(DetalleVenta)
    private readonly detalleVentaRepository: Repository<DetalleVenta>,
    private readonly inventarioService: InventarioService,
    private readonly cxcService: CxcService,
    private readonly integracionContableService: IntegracionContableService,
    private readonly foliosService: FoliosService,
    private readonly centrosCostoService: CentrosCostoService,
    private readonly dataSource: DataSource,
  ) {}

  async crearVenta(dto: CreateVentaDto, usuarioId: number) {
    try {
      const cliente = await this.clienteRepository.findOne({
        where: { publicId: dto.clienteId },
      });
      if (!cliente)
        throw new BadRequestException(`El cliente ${dto.clienteId} no existe`);

      let cotizacionId: number | undefined;
      if (dto.cotizacionId) {
        const cot = await this.cotizacionRepository.findOne({
          where: { publicId: dto.cotizacionId },
        });
        if (!cot)
          throw new BadRequestException(
            `La cotización ${dto.cotizacionId} no existe`,
          );
        cotizacionId = cot.id;
      }

      let vendedorId: number | undefined;
      if (dto.vendedorId) {
        const vendedor = await this.dataSource
          .getRepository(Empleado)
          .findOne({ where: { publicId: dto.vendedorId } });
        if (!vendedor)
          throw new BadRequestException(
            `El vendedor ${dto.vendedorId} no existe`,
          );
        vendedorId = vendedor.id;
      }

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

      const { procesados, subtotal, descuento, iva, total } = calcularDetalles(
        dto.detalles,
      );
      const detallesResueltos = await Promise.all(
        procesados.map(async (d) => {
          const producto = await this.dataSource
            .getRepository(Producto)
            .findOne({ where: { publicId: d.productoId } });
          if (!producto)
            throw new BadRequestException(
              `El producto ${d.productoId} no existe`,
            );
          return {
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            descuento: d.descuento,
            subtotal: d.subtotal,
            productoId: producto.id,
          };
        }),
      );

      const ventaId = await this.dataSource.transaction(async (manager) => {
        const folio = await this.foliosService.siguiente('venta', {}, manager);
        const ventaRepo = manager.getRepository(Venta);
        const venta = ventaRepo.create({
          folio: `VT-${this.fechaFolio()}-${String(folio).padStart(4, '0')}`,
          clienteId: cliente.id,
          cotizacionId,
          fechaVenta: dto.fechaVenta ? new Date(dto.fechaVenta) : new Date(),
          subtotal,
          descuento,
          iva,
          total,
          observaciones: dto.observaciones,
          vendedorId,
          centroCostoId,
          usuarioId,
        });
        const guardada = await ventaRepo.save(venta);

        const detalleRepo = manager.getRepository(DetalleVenta);
        await detalleRepo.save(
          detallesResueltos.map((d) => ({ ...d, ventaId: guardada.id })),
        );
        if (cotizacionId) {
          await manager
            .getRepository(Cotizacion)
            .update(cotizacionId, { estatus: 'aprobada' });
        }

        await this.cxcService.crearDesdeVenta(guardada, usuarioId, manager);
        return guardada.id;
      });

      return await this.ventaRepository.findOne({
        where: { id: ventaId },
        relations: {
          cliente: true,
          vendedor: true,
          usuario: true,
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

  async buscarVentas() {
    return await this.ventaRepository.find({
      relations: {
        cliente: true,
        vendedor: true,
        centroCosto: true,
        detalles: {
          producto: true,
        },
      },
      order: { id: 'DESC' },
    });
  }

  async paginarVentas(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) where.folio = ILike(`%${buscar}%`);
    const data = await this.ventaRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: {
        cliente: true,
        vendedor: true,
        centroCosto: true,
      },
      order: { id: 'DESC' },
    });
    const total = await this.ventaRepository.count({ where });
    return { total, data };
  }

  async buscarVentaPorId(publicId: string) {
    const item = await this.ventaRepository.findOne({
      where: { publicId },
      relations: {
        cliente: true,
        vendedor: true,
        usuario: true,
        centroCosto: true,
        detalles: {
          producto: true,
        },
      },
    });
    if (!item) throw new BadRequestException(`La venta ${publicId} no existe`);
    return item;
  }

  async buscarVentasPorCliente(clienteId: string) {
    const cliente = await this.clienteRepository.findOne({
      where: { publicId: clienteId },
    });
    if (!cliente)
      throw new BadRequestException(`El cliente ${clienteId} no existe`);
    return await this.ventaRepository.find({
      where: { clienteId: cliente.id },
      relations: {
        cliente: true,
        centroCosto: true,
        detalles: {
          producto: true,
        },
      },
      order: { id: 'DESC' },
    });
  }

  async actualizarEstatusVenta(
    publicId: string,
    dto: UpdateEstatusVentaDto,
    usuarioId: number,
  ) {
    const venta = await this.ventaRepository.findOne({
      where: { publicId },
      relations: {
        detalles: {
          producto: true,
        },
      },
    });
    if (!venta) throw new BadRequestException(`La venta ${publicId} no existe`);

    if (venta.estatus === 'completada' || venta.estatus === 'cancelada') {
      throw new BadRequestException(
        `La venta ya está ${venta.estatus}, no se puede modificar`,
      );
    }
    if (venta.estatus === 'pendiente' && dto.estatus === 'cancelada') {
      await this.dataSource.transaction(async (manager) => {
        await manager
          .getRepository(Venta)
          .update(venta.id, { estatus: 'cancelada' });
        await this.cxcService.cancelarPorVenta(venta.id, usuarioId, manager);
      });
      return { msg: 'Venta cancelada exitosamente' };
    }

    await this.dataSource.transaction(async (manager) => {
      if (dto.estatus === 'completada') {
        for (const det of venta.detalles) {
          await this.inventarioService.actualizarInventario(
            det.productoId,
            1,
            Number(det.cantidad),
            'salida',
            venta.folio,
            `Salida por venta ${venta.folio}`,
            usuarioId,
            manager,
          );
        }

        await this.integracionContableService.registrarCostoVenta(
          venta,
          usuarioId,
          manager,
          venta.centroCostoId,
        );
      }

      await manager
        .getRepository(Venta)
        .update(venta.id, { estatus: dto.estatus });
      if (dto.estatus === 'cancelada') {
        await this.cxcService.cancelarPorVenta(venta.id, usuarioId, manager);
      }
    });

    return {
      msg: `Venta ${dto.estatus === 'completada' ? 'completada' : 'cancelada'} exitosamente`,
    };
  }

  async buscarDetallesVenta(ventaPublicId: string) {
    const venta = await this.ventaRepository.findOne({
      where: { publicId: ventaPublicId },
    });
    if (!venta)
      throw new BadRequestException(`La venta ${ventaPublicId} no existe`);
    return await this.detalleVentaRepository.find({
      where: { ventaId: venta.id },
      relations: {
        producto: true,
      },
      order: { id: 'ASC' },
    });
  }
}
