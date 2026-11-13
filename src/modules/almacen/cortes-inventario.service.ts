import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Almacen } from './entities/almacen.entity';
import { CorteInventario } from './entities/corte-inventario.entity';
import { CorteInventarioDetalle } from './entities/corte-inventario-detalle.entity';
import { CreateCorteInventarioDto } from './dto/create-corte-inventario.dto';
import { BuscarCortesInventarioDto } from './dto/buscar-cortes-inventario.dto';
import { InventarioService } from './inventario.service';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function escaparCsv(valor: unknown) {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  if (/[",\r\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

@Injectable()
export class CortesInventarioService {
  constructor(
    @InjectRepository(CorteInventario)
    private readonly corteRepository: Repository<CorteInventario>,
    @InjectRepository(CorteInventarioDetalle)
    private readonly detalleRepository: Repository<CorteInventarioDetalle>,
    @InjectRepository(Almacen)
    private readonly almacenRepository: Repository<Almacen>,
    private readonly inventarioService: InventarioService,
    private readonly dataSource: DataSource,
  ) {}

  async crearCorte(dto: CreateCorteInventarioDto, usuarioId?: number) {
    const almacen = await this.almacenRepository.findOne({
      where: { publicId: dto.almacenId, activo: true },
    });
    if (!almacen) {
      throw new BadRequestException(
        `El almacén ${dto.almacenId} no existe o está inactivo`,
      );
    }

    const ahora = new Date();
    const anioActual = ahora.getFullYear();
    const mesActual = ahora.getMonth() + 1;
    if (
      dto.anio > anioActual ||
      (dto.anio === anioActual && dto.mes > mesActual)
    ) {
      throw new BadRequestException(
        'No se puede generar un corte de un periodo futuro',
      );
    }

    const existente = await this.corteRepository.findOne({
      where: { almacen: { id: almacen.id }, anio: dto.anio, mes: dto.mes },
    });
    if (existente) {
      throw new BadRequestException(
        `Ya existe un corte de ${MESES[dto.mes - 1]} ${dto.anio} para ${almacen.nombre}`,
      );
    }

    const finDeMes = new Date(dto.anio, dto.mes, 0, 23, 59, 59, 999);
    const fechaCorte = finDeMes > ahora ? ahora : finDeMes;
    const stock = await this.inventarioService.obtenerStockHistorico(
      almacen.id,
      fechaCorte,
    );

    if (stock.length === 0) {
      throw new BadRequestException(
        `No hay movimientos de inventario registrados hasta ${MESES[dto.mes - 1]} ${dto.anio} para ${almacen.nombre}`,
      );
    }

    const totalUnidades = stock.reduce(
      (total, fila) => total + fila.existencia,
      0,
    );
    const totalValorCosto = stock.reduce(
      (total, fila) =>
        total + fila.existencia * Number(fila.producto.precioCosto),
      0,
    );
    const totalValorVenta = stock.reduce(
      (total, fila) =>
        total + fila.existencia * Number(fila.producto.precioVenta),
      0,
    );

    return this.dataSource.transaction(async (manager) => {
      const corteRepo = manager.getRepository(CorteInventario);
      const detalleRepo = manager.getRepository(CorteInventarioDetalle);

      const corte = await corteRepo.save(
        corteRepo.create({
          almacen,
          anio: dto.anio,
          mes: dto.mes,
          fechaCorte,
          usuarioId: usuarioId ?? null,
          totalProductos: stock.length,
          totalUnidades: Number(totalUnidades.toFixed(2)),
          totalValorCosto: Number(totalValorCosto.toFixed(2)),
          totalValorVenta: Number(totalValorVenta.toFixed(2)),
        }),
      );

      const detalles = stock.map((fila) => {
        const existencia = fila.existencia;
        const precioCosto = Number(fila.producto.precioCosto);
        const precioVenta = Number(fila.producto.precioVenta);
        return detalleRepo.create({
          corte,
          codigo: fila.producto.codigo,
          nombre: fila.producto.nombre,
          categoria: fila.producto.categoria?.nombre ?? null,
          unidadMedida: fila.producto.unidadMedida?.nombre ?? null,
          existencia,
          precioCosto,
          precioVenta,
          valorCosto: Number((existencia * precioCosto).toFixed(2)),
          valorVenta: Number((existencia * precioVenta).toFixed(2)),
        });
      });

      if (detalles.length > 0) {
        await detalleRepo.save(detalles);
      }

      return { ...corte, almacen };
    });
  }

  async buscarCortes(query: BuscarCortesInventarioDto) {
    const { pagina = 1, registros = 10, almacenId, anio } = query;
    const where: Record<string, unknown> = {};

    if (almacenId) {
      const almacen = await this.almacenRepository.findOne({
        where: { publicId: almacenId },
      });
      if (!almacen)
        throw new BadRequestException(`El almacén ${almacenId} no existe`);
      where.almacen = { id: almacen.id };
    }
    if (anio) where.anio = anio;

    const [data, total] = await this.corteRepository.findAndCount({
      where,
      relations: { almacen: true },
      order: { anio: 'DESC', mes: 'DESC', id: 'DESC' },
      skip: (pagina - 1) * registros,
      take: registros,
    });

    return { total, pagina, registros, data };
  }

  async buscarCortePorId(publicId: string) {
    const corte = await this.corteRepository.findOne({
      where: { publicId },
      relations: { almacen: true },
    });
    if (!corte) {
      throw new BadRequestException(`El corte ${publicId} no existe`);
    }

    const detalles = await this.detalleRepository.find({
      where: { corte: { id: corte.id } },
      order: { nombre: 'ASC' },
    });

    return { ...corte, detalles };
  }

  async generarCsv(publicId: string) {
    const corte = await this.buscarCortePorId(publicId);

    const encabezados = [
      'Código',
      'Producto',
      'Categoría',
      'Unidad',
      'Existencia',
      'Costo unitario',
      'Valor costo',
      'Precio venta',
      'Valor venta',
    ];

    const filas = corte.detalles.map((detalle) => [
      detalle.codigo,
      detalle.nombre,
      detalle.categoria ?? '',
      detalle.unidadMedida ?? '',
      Number(detalle.existencia).toFixed(2),
      Number(detalle.precioCosto).toFixed(2),
      Number(detalle.valorCosto).toFixed(2),
      Number(detalle.precioVenta).toFixed(2),
      Number(detalle.valorVenta).toFixed(2),
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) => fila.map(escaparCsv).join(','))
      .join('\r\n');

    const nombreArchivo = `corte-${corte.almacen.nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}-${corte.anio}-${String(corte.mes).padStart(2, '0')}.csv`;

    return { nombreArchivo, contenido };
  }
}
