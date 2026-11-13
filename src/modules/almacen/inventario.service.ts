import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, EntityManager, FindOneOptions, In, Repository } from 'typeorm';
import { Producto } from './entities/producto.entity';
import { Almacen } from './entities/almacen.entity';
import { Inventario } from './entities/inventario.entity';
import { MovimientoInventario } from './entities/movimiento-inventario.entity';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { ConsultaStockInventarioDto } from './dto/consulta-stock-inventario.dto';
import { ProductosService } from './productos.service';
import { AlmacenesService } from './almacenes.service';

export type StockProducto = {
  producto: Producto;
  existencia: number;
};

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(Almacen)
    private readonly almacenRepository: Repository<Almacen>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(MovimientoInventario)
    private readonly movimientoRepository: Repository<MovimientoInventario>,
    private readonly productosService: ProductosService,
    private readonly almacenesService: AlmacenesService,
  ) {}

  async buscarInventario() {
    return await this.inventarioRepository.find({
      relations: {
        producto: {
          unidadMedida: true,
        },
        almacen: true,
      },
      order: { id: 'DESC' },
    });
  }

  async listarAlmacenesActivos() {
    return await this.almacenRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Stock de todos los productos activos. Si se indica almacén, muestra su
   * existencia; si se omite, suma la existencia de todos los almacenes.
   */
  async buscarStock(consulta: ConsultaStockInventarioDto) {
    const { pagina = 1, registros = 10, buscar, almacenId } = consulta;

    const query = this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.unidadMedida', 'unidadMedida')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .where('producto.activo = true');

    if (buscar?.trim()) {
      query.andWhere(
        '(producto.nombre ILIKE :buscar OR producto.codigo ILIKE :buscar)',
        { buscar: `%${buscar.trim()}%` },
      );
    }

    const [productos, total] = await query
      .orderBy('producto.nombre', 'ASC')
      .skip((pagina - 1) * registros)
      .take(registros)
      .getManyAndCount();

    let almacenIdInterno: number | undefined;
    if (almacenId) {
      const almacen = await this.almacenRepository.findOne({
        where: { publicId: almacenId },
      });
      if (!almacen)
        throw new BadRequestException(`El almacén ${almacenId} no existe`);
      almacenIdInterno = almacen.id;
    }

    const existencias = await this.existenciasPorProducto(
      productos.map((producto) => producto.id),
      almacenIdInterno,
    );

    const data = productos.map((producto) => {
      const existencia = existencias.get(producto.id) ?? 0;
      const precioCosto = Number(producto.precioCosto);
      const precioVenta = Number(producto.precioVenta);
      return {
        productoId: producto.publicId,
        codigo: producto.codigo,
        nombre: producto.nombre,
        categoria: producto.categoria?.nombre ?? null,
        unidadMedida: producto.unidadMedida?.nombre ?? null,
        existencia,
        precioCosto,
        precioVenta,
        valorCosto: Number((existencia * precioCosto).toFixed(2)),
        valorVenta: Number((existencia * precioVenta).toFixed(2)),
      };
    });

    return { total, pagina, registros, data };
  }

  /** Stock completo (sin paginar) de un almacén, usado por los cortes. */
  async obtenerStockPorAlmacen(almacenIdInterno: number) {
    const productos = await this.productoRepository.find({
      where: { activo: true },
      relations: { unidadMedida: true, categoria: true },
      order: { nombre: 'ASC' },
    });
    const existencias = await this.existenciasPorProducto(
      productos.map((producto) => producto.id),
      almacenIdInterno,
    );
    return productos.map<StockProducto>((producto) => ({
      producto,
      existencia: existencias.get(producto.id) ?? 0,
    }));
  }

  /**
   * Reconstruye el stock de un almacén al cierre de una fecha usando el
   * último movimiento de cada producto registrado hasta ese momento.
   */
  async obtenerStockHistorico(almacenIdInterno: number, fechaCorte: Date) {
    const movimientos = await this.movimientoRepository
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.producto', 'producto')
      .leftJoinAndSelect('producto.unidadMedida', 'unidadMedida')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .where('movimiento.almacenId = :almacenId', {
        almacenId: almacenIdInterno,
      })
      .andWhere('movimiento.fechaCreacion <= :fechaCorte', { fechaCorte })
      .orderBy('movimiento.productoId', 'ASC')
      .addOrderBy('movimiento.fechaCreacion', 'DESC')
      .addOrderBy('movimiento.id', 'DESC')
      .getMany();

    const vistos = new Set<number>();
    const stock: StockProducto[] = [];

    for (const movimiento of movimientos) {
      const producto = movimiento.producto;
      if (!producto || vistos.has(producto.id)) continue;
      vistos.add(producto.id);
      stock.push({
        producto,
        existencia: Number(movimiento.existenciaNueva),
      });
    }

    return stock;
  }

  private async existenciasPorProducto(
    productoIds: number[],
    almacenIdInterno?: number,
  ) {
    const mapa = new Map<number, number>();
    if (productoIds.length === 0) return mapa;

    const filas = await this.inventarioRepository.find({
      where: {
        productoId: In(productoIds),
        ...(almacenIdInterno ? { almacenId: almacenIdInterno } : {}),
      },
      relations: { producto: true },
    });

    for (const fila of filas) {
      const id = fila.producto?.id;
      if (!id) continue;
      mapa.set(id, (mapa.get(id) ?? 0) + Number(fila.existencia));
    }
    return mapa;
  }

  async paginarInventario(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) {
      where.producto = { nombre: ILike(`%${buscar}%`) };
    }
    const data = await this.inventarioRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: {
        producto: {
          unidadMedida: true,
        },
        almacen: true,
      },
      order: { id: 'DESC' },
    });
    const total = await this.inventarioRepository.count({ where });
    return { total, data };
  }

  async buscarInventarioPorProductoAlmacen(
    productoId: string,
    almacenId: string,
  ) {
    const producto =
      await this.productosService.buscarProductoPorId(productoId);
    const almacen = await this.almacenesService.buscarAlmacenPorId(almacenId);
    if (!producto || !almacen) {
      throw new BadRequestException(`Producto o almacén no existe`);
    }
    const item = await this.inventarioRepository.findOne({
      where: { productoId: producto.id, almacenId: almacen.id },
      relations: {
        producto: {
          unidadMedida: true,
        },
        almacen: true,
      },
    });
    if (!item) {
      return { productoId, almacenId, existencia: 0 };
    }
    return item;
  }

  /**
   * Método de integración usado por ventas, compras y mantenimiento.
   * Actualiza la existencia y registra el movimiento correspondiente.
   */
  async actualizarInventario(
    productoId: number,
    almacenId: number,
    cantidad: number,
    tipo: 'entrada' | 'salida' | 'ajuste',
    referencia?: string,
    observaciones?: string,
    usuarioId?: number,
    manager?: EntityManager,
  ) {
    const productoRepo = manager
      ? manager.getRepository(Producto)
      : this.productoRepository;
    const almacenRepo = manager
      ? manager.getRepository(Almacen)
      : this.almacenRepository;
    const inventarioRepo = manager
      ? manager.getRepository(Inventario)
      : this.inventarioRepository;
    const movimientoRepo = manager
      ? manager.getRepository(MovimientoInventario)
      : this.movimientoRepository;

    const producto = await productoRepo.findOne({
      where: { id: productoId },
    });
    if (!producto)
      throw new BadRequestException(`El producto ${productoId} no existe`);
    const almacen = await almacenRepo.findOne({
      where: { id: almacenId },
    });
    if (!almacen)
      throw new BadRequestException(`El almacén ${almacenId} no existe`);

    const opciones: FindOneOptions<Inventario> = {
      where: { productoId, almacenId },
    };
    if (manager) opciones.lock = { mode: 'pessimistic_write' };

    let inventario = await inventarioRepo.findOne(opciones);
    if (!inventario) {
      inventario = inventarioRepo.create({
        productoId,
        almacenId,
        existencia: 0,
      });
      inventario = await inventarioRepo.save(inventario);
    }

    const existenciaAnterior = Number(inventario.existencia);
    let existenciaNueva = existenciaAnterior;

    switch (tipo) {
      case 'entrada':
        existenciaNueva = existenciaAnterior + cantidad;
        break;
      case 'salida':
        existenciaNueva = existenciaAnterior - cantidad;
        if (existenciaNueva < 0) {
          throw new BadRequestException(
            'No hay suficiente existencia en el almacén',
          );
        }
        break;
      case 'ajuste':
        existenciaNueva = cantidad;
        break;
    }

    await inventarioRepo.update(inventario.id, {
      existencia: existenciaNueva,
    });

    const movimiento = movimientoRepo.create({
      productoId,
      almacenId,
      tipo,
      cantidad,
      existenciaAnterior,
      existenciaNueva,
      referencia,
      observaciones,
      usuarioId,
    });
    return await movimientoRepo.save(movimiento);
  }
}
