import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardResponseDto, RangoDashboardDto } from './dto';
import {
  claveDia,
  DashboardBaseService,
  parseDia,
  redondear2,
  sumarDias,
} from './helpers/dashboard-base.service';

@Injectable()
export class DashboardAlmacenService extends DashboardBaseService {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async obtenerDashboardAlmacen(
    query: RangoDashboardDto,
  ): Promise<DashboardResponseDto> {
    const r = this.resolverRango(query);
    const bMov = this.bucketExpr('m.fecha_creacion', r.agrupacion);
    const corte = claveDia(sumarDias(parseDia(r.hasta), -90));

    const valorAlmacen = await this.dataSource.query(
      `SELECT a.nombre AS nombre,
              COALESCE(SUM(i.existencia * p.precio_costo), 0) AS valor
       FROM inventario i
       JOIN productos p ON p.id = i.producto_id
       JOIN almacenes a ON a.id = i.almacen_id
       GROUP BY 1 ORDER BY 2 DESC`,
    );

    const valorCategoria = await this.dataSource.query(
      `SELECT COALESCE(c.nombre, 'Sin categoría') AS nombre,
              COALESCE(SUM(i.existencia * p.precio_costo), 0) AS valor
       FROM inventario i
       JOIN productos p ON p.id = i.producto_id
       LEFT JOIN categorias_producto c ON c.id = p.categoria_id
       GROUP BY 1 ORDER BY 2 DESC`,
    );

    const movimientos = await this.dataSource.query(
      `SELECT ${bMov} AS bucket, m.tipo AS estatus,
              COALESCE(SUM(m.cantidad), 0) AS valor
       FROM movimientos_inventario m
       WHERE m.fecha_creacion::date BETWEEN $1 AND $2
       GROUP BY 1, 2`,
      [r.desde, r.hasta],
    );

    const porTipo = await this.dataSource.query(
      `SELECT m.tipo AS nombre, COUNT(*) AS valor
       FROM movimientos_inventario m
       WHERE m.fecha_creacion::date BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 2 DESC`,
      [r.desde, r.hasta],
    );

    const sinRotacion = await this.dataSource.query(
      `SELECT p.nombre AS nombre,
              COALESCE(SUM(i.existencia), 0) AS valor
       FROM productos p
       LEFT JOIN inventario i ON i.producto_id = p.id
       WHERE p.activo = true
         AND NOT EXISTS (
           SELECT 1 FROM movimientos_inventario m
           WHERE m.producto_id = p.id AND m.fecha_creacion::date >= $1
         )
       GROUP BY 1 ORDER BY 2 DESC LIMIT 15`,
      [corte],
    );

    const [kpiValor] = await this.dataSource.query(
      `SELECT COALESCE(SUM(i.existencia * p.precio_costo), 0) AS suma
       FROM inventario i JOIN productos p ON p.id = i.producto_id`,
    );
    const [kpiSkus] = await this.dataSource.query(
      `SELECT COUNT(*) AS n FROM productos WHERE activo = true`,
    );
    const [kpiAlmacenes] = await this.dataSource.query(
      `SELECT COUNT(*) AS n FROM almacenes WHERE activo = true`,
    );

    const tiposMov = ['entrada', 'salida', 'ajuste'];
    return {
      kpis: [
        this.kpi(
          'valorTotal',
          'Valor total del inventario',
          redondear2(kpiValor.suma),
          'MXN',
        ),
        this.kpi('skusActivos', 'SKUs activos', Number(kpiSkus.n)),
        this.kpi('numAlmacenes', 'Almacenes activos', Number(kpiAlmacenes.n)),
      ],
      graficas: {
        valorPorAlmacen: this.grafica(
          'barras',
          valorAlmacen.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Valor',
              datos: valorAlmacen.map((x: { valor: unknown }) =>
                redondear2(x.valor),
              ),
            },
          ],
        ),
        inventarioPorCategoria: this.grafica(
          'dona',
          valorCategoria.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Valor',
              datos: valorCategoria.map((x: { valor: unknown }) =>
                redondear2(x.valor),
              ),
            },
          ],
        ),
        entradasVsSalidas: this.grafica(
          'linea',
          r.buckets.map((x) => x.label),
          this.pivot(r.buckets, movimientos, tiposMov).map((s) => ({
            nombre: s.nombre,
            datos: s.datos.map(redondear2),
          })),
        ),
        movimientosPorTipo: this.grafica(
          'barras',
          porTipo.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Movimientos',
              datos: porTipo.map((x: { valor: unknown }) => Number(x.valor)),
            },
          ],
        ),
        sinRotacion: this.grafica(
          'barras-horizontales',
          sinRotacion.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Existencia',
              datos: sinRotacion.map((x: { valor: unknown }) =>
                redondear2(x.valor),
              ),
            },
          ],
        ),
      },
    };
  }
}
