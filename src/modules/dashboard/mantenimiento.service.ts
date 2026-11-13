import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardResponseDto, RangoDashboardDto } from './dto';
import {
  DashboardBaseService,
  redondear2,
} from './helpers/dashboard-base.service';

@Injectable()
export class DashboardMantenimientoService extends DashboardBaseService {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async obtenerDashboardMantenimiento(
    query: RangoDashboardDto,
  ): Promise<DashboardResponseDto> {
    const r = this.resolverRango(query);
    const bCosto = this.bucketExpr(
      'COALESCE(ot.fecha_ejecucion, ot.fecha_programada)',
      r.agrupacion,
    );
    const bCons = this.bucketExpr('m.fecha_creacion', r.agrupacion);
    const mes = this.mesActual();

    const porEstado = await this.dataSource.query(
      `SELECT e.estado AS nombre, COUNT(*) AS valor
       FROM equipos e GROUP BY 1 ORDER BY 2 DESC`,
    );

    const costos = await this.dataSource.query(
      `SELECT ${bCosto} AS bucket, COALESCE(SUM(ot.costo), 0) AS valor
       FROM ordenes_trabajo ot
       WHERE ot.estatus = 'completada'
         AND COALESCE(ot.fecha_ejecucion, ot.fecha_programada) BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 1`,
      [r.desde, r.hasta],
    );

    const porEstatus = await this.dataSource.query(
      `SELECT ot.estatus AS nombre, COUNT(*) AS valor
       FROM ordenes_trabajo ot
       WHERE ot.fecha_programada BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 2 DESC`,
      [r.desde, r.hasta],
    );

    const gastoEquipo = await this.dataSource.query(
      `SELECT e.nombre AS nombre, COALESCE(SUM(ot.costo), 0) AS valor
       FROM ordenes_trabajo ot
       JOIN equipos e ON e.id = ot.equipo_id
       WHERE ot.estatus = 'completada'
         AND COALESCE(ot.fecha_ejecucion, ot.fecha_programada) BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
      [r.desde, r.hasta],
    );

    const [cumplimiento] = await this.dataSource.query(
      `SELECT COUNT(*) FILTER (WHERE fecha_proxima_ejecucion < CURRENT_DATE) AS vencidos,
              COUNT(*) FILTER (WHERE fecha_proxima_ejecucion >= CURRENT_DATE) AS al_dia
       FROM planes_mantenimiento WHERE activo = true`,
    );

    const consumo = await this.dataSource.query(
      `SELECT ${bCons} AS bucket, m.tipo AS estatus,
              COALESCE(SUM(m.cantidad), 0) AS valor
       FROM movimientos_refacciones m
       WHERE m.fecha_creacion::date BETWEEN $1 AND $2
       GROUP BY 1, 2`,
      [r.desde, r.hasta],
    );

    const [kpiAbiertas] = await this.dataSource.query(
      `SELECT COUNT(*) AS n FROM ordenes_trabajo
       WHERE estatus IN ('pendiente', 'en_progreso')`,
    );
    const [kpiCostoMes] = await this.dataSource.query(
      `SELECT COALESCE(SUM(costo), 0) AS suma FROM ordenes_trabajo
       WHERE estatus = 'completada'
         AND COALESCE(fecha_ejecucion, fecha_programada) BETWEEN $1 AND $2`,
      [mes.desde, mes.hasta],
    );
    const [kpiBajoStock] = await this.dataSource.query(
      `SELECT COUNT(*) AS n FROM refacciones rf
       WHERE rf.activo = true AND rf.stock_minimo > 0
         AND COALESCE((
           SELECT SUM(CASE WHEN m.tipo = 'entrada' THEN m.cantidad
                           WHEN m.tipo = 'salida' THEN -m.cantidad
                           ELSE 0 END)
           FROM movimientos_refacciones m WHERE m.refaccion_id = rf.id
         ), 0) < rf.stock_minimo`,
    );
    const [kpiProximos] = await this.dataSource.query(
      `SELECT COUNT(*) FILTER (
                WHERE fecha_proxima_ejecucion BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
              ) AS p7,
              COUNT(*) FILTER (
                WHERE fecha_proxima_ejecucion BETWEEN CURRENT_DATE + 8 AND CURRENT_DATE + 30
              ) AS p30
       FROM planes_mantenimiento WHERE activo = true`,
    );

    const tiposCons = ['entrada', 'salida', 'ajuste'];
    return {
      kpis: [
        this.kpi('ordenesAbiertas', 'Órdenes abiertas', Number(kpiAbiertas.n)),
        this.kpi(
          'costoMes',
          'Costo del mes',
          redondear2(kpiCostoMes.suma),
          'MXN',
        ),
        this.kpi(
          'refaccionesBajoStock',
          'Refacciones bajo stock',
          Number(kpiBajoStock.n),
        ),
        this.kpi(
          'proximos7Dias',
          'Mantenimientos próximos (7 días)',
          Number(kpiProximos.p7),
        ),
        this.kpi(
          'proximos30Dias',
          'Mantenimientos próximos (8-30 días)',
          Number(kpiProximos.p30),
        ),
      ],
      graficas: {
        equiposPorEstado: this.grafica(
          'dona',
          porEstado.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Equipos',
              datos: porEstado.map((x: { valor: unknown }) => Number(x.valor)),
            },
          ],
        ),
        costoPorMes: this.grafica(
          'linea',
          r.buckets.map((x) => x.label),
          [
            {
              nombre: 'Costo',
              datos: this.serieEnBuckets(r.buckets, costos).map(redondear2),
            },
          ],
        ),
        ordenesPorEstatus: this.grafica(
          'barras',
          porEstatus.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Órdenes',
              datos: porEstatus.map((x: { valor: unknown }) => Number(x.valor)),
            },
          ],
        ),
        gastoPorEquipo: this.grafica(
          'barras-horizontales',
          gastoEquipo.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Gasto',
              datos: gastoEquipo.map((x: { valor: unknown }) =>
                redondear2(x.valor),
              ),
            },
          ],
        ),
        cumplimientoPreventivo: this.grafica(
          'barras',
          ['Vencidos', 'Al día'],
          [
            {
              nombre: 'Planes',
              datos: [
                Number(cumplimiento.vencidos),
                Number(cumplimiento.al_dia),
              ],
            },
          ],
        ),
        consumoRefacciones: this.grafica(
          'barras',
          r.buckets.map((x) => x.label),
          this.pivot(r.buckets, consumo, tiposCons).map((s) => ({
            nombre: s.nombre,
            datos: s.datos.map(redondear2),
          })),
        ),
      },
    };
  }
}
