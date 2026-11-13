import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, DataSource, ILike, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Almacen } from './entities/almacen.entity';
import { Producto } from './entities/producto.entity';
import { OrdenSalida } from './entities/orden-salida.entity';
import { OrdenSalidaDetalle } from './entities/orden-salida-detalle.entity';
import { InventarioService } from './inventario.service';
import { FoliosService } from '../contabilidad/folios.service';
import { CreateOrdenSalidaDto } from './dto/create-orden-salida.dto';
import { BuscarOrdenesSalidaDto } from './dto/buscar-ordenes-salida.dto';

@Injectable()
export class OrdenesSalidaService {
  constructor(
    @InjectRepository(OrdenSalida)
    private readonly ordenRepository: Repository<OrdenSalida>,
    @InjectRepository(OrdenSalidaDetalle)
    private readonly detalleRepository: Repository<OrdenSalidaDetalle>,
    @InjectRepository(Almacen)
    private readonly almacenRepository: Repository<Almacen>,
    private readonly inventarioService: InventarioService,
    private readonly foliosService: FoliosService,
    private readonly dataSource: DataSource,
  ) {}

  async crearOrdenSalida(dto: CreateOrdenSalidaDto, usuarioId?: number) {
    const almacen = await this.almacenRepository.findOne({
      where: { publicId: dto.almacenId, activo: true },
    });
    if (!almacen) {
      throw new BadRequestException(
        `El almacén ${dto.almacenId} no existe o está inactivo`,
      );
    }

    const totalUnidades = dto.detalles.reduce(
      (total, detalle) => total + Number(detalle.cantidad),
      0,
    );

    return this.dataSource.transaction(async (manager) => {
      const ordenRepo = manager.getRepository(OrdenSalida);
      const detalleRepo = manager.getRepository(OrdenSalidaDetalle);
      const productoRepo = manager.getRepository(Producto);

      const secuencial = await this.foliosService.siguiente(
        'salida',
        {},
        manager,
      );
      const folio = `SAL-${this.fechaFolio()}-${String(secuencial).padStart(4, '0')}`;

      const orden = await ordenRepo.save(
        ordenRepo.create({
          folio,
          almacen,
          fechaSalida: dto.fechaSalida as unknown as Date,
          motivo: dto.motivo,
          observaciones: dto.observaciones ?? null,
          usuarioId: usuarioId ?? null,
          totalProductos: dto.detalles.length,
          totalUnidades: Number(totalUnidades.toFixed(2)),
          estatus: 'aplicada',
        }),
      );

      const detalles: OrdenSalidaDetalle[] = [];
      for (const item of dto.detalles) {
        const producto = await productoRepo.findOne({
          where: { publicId: item.productoId },
          relations: { unidadMedida: true },
        });
        if (!producto) {
          throw new BadRequestException(
            `El producto ${item.productoId} no existe`,
          );
        }

        const movimiento = await this.inventarioService.actualizarInventario(
          producto.id,
          almacen.id,
          Number(item.cantidad),
          'salida',
          folio,
          dto.motivo,
          usuarioId,
          manager,
        );

        detalles.push(
          detalleRepo.create({
            orden,
            producto,
            codigo: producto.codigo,
            nombre: producto.nombre,
            unidadMedida: producto.unidadMedida?.nombre ?? null,
            cantidad: Number(item.cantidad),
            existenciaAnterior: Number(movimiento.existenciaAnterior),
            existenciaNueva: Number(movimiento.existenciaNueva),
          }),
        );
      }

      await detalleRepo.save(detalles);

      return { ...orden, almacen, detalles };
    });
  }

  async buscarOrdenes(query: BuscarOrdenesSalidaDto) {
    const { pagina = 1, registros = 10, buscar, almacenId } = query;
    const where: Record<string, unknown> = {};

    if (almacenId) {
      const almacen = await this.almacenRepository.findOne({
        where: { publicId: almacenId },
      });
      if (!almacen)
        throw new BadRequestException(`El almacén ${almacenId} no existe`);
      where.almacen = { id: almacen.id };
    }
    if (buscar?.trim()) {
      where.folio = ILike(`%${buscar.trim()}%`);
    }
    if (query.fechaDesde && query.fechaHasta) {
      where.fechaSalida = And(
        MoreThanOrEqual(query.fechaDesde),
        LessThanOrEqual(query.fechaHasta),
      );
    } else if (query.fechaDesde) {
      where.fechaSalida = MoreThanOrEqual(query.fechaDesde);
    } else if (query.fechaHasta) {
      where.fechaSalida = LessThanOrEqual(query.fechaHasta);
    }

    const [data, total] = await this.ordenRepository.findAndCount({
      where,
      relations: { almacen: true },
      order: { fechaSalida: 'DESC', id: 'DESC' },
      skip: (pagina - 1) * registros,
      take: registros,
    });

    return { total, pagina, registros, data };
  }

  async buscarOrdenPorId(publicId: string) {
    const orden = await this.ordenRepository.findOne({
      where: { publicId },
      relations: { almacen: true },
    });
    if (!orden) {
      throw new BadRequestException(`La orden de salida ${publicId} no existe`);
    }

    const detalles = await this.detalleRepository.find({
      where: { orden: { id: orden.id } },
      order: { id: 'ASC' },
    });

    return { ...orden, detalles };
  }

  async listarAlmacenesActivos() {
    return await this.almacenRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async listarStockAlmacen(almacenId: string) {
    const almacen = await this.almacenRepository.findOne({
      where: { publicId: almacenId, activo: true },
    });
    if (!almacen) {
      throw new BadRequestException(
        `El almacén ${almacenId} no existe o está inactivo`,
      );
    }

    const stock = await this.inventarioService.obtenerStockPorAlmacen(
      almacen.id,
    );
    return stock.map(({ producto, existencia }) => ({
      productoId: producto.publicId,
      codigo: producto.codigo,
      nombre: producto.nombre,
      existencia,
    }));
  }

  private fechaFolio() {
    const fecha = new Date();
    return `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}`;
  }
}
