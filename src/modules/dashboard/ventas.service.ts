import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardResponseDto, RangoDashboardDto } from './dto';
import {
  DashboardBaseService,
  redondear2,
} from './helpers/dashboard-base.service';

@Injectable()
export class DashboardVentasService extends DashboardBaseService {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async obtenerDashboardVentas(
    query: RangoDashboardDto,
  ): Promise<DashboardResponseDto> {
    const r = this.resolverRango(query);
    const bVenta = this.bucketExpr('v.fecha_venta', r.agrupacion);
    const bCot = this.bucketExpr('c.fecha', r.agrupacion);
    const mes = this.mesActual();
    const prev = this.mesPrevio();

    const ingresos = await this.dataSource.query(
      `SELECT ${bVenta} AS bucket, COALESCE(SUM(v.total), 0) AS valor
       FROM ventas v
       WHERE v.estatus = 'completada' AND v.fecha_venta BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 1`,
      [r.desde, r.hasta],
    );

    const porVendedor = await this.dataSource.query(
      `SELECT TRIM(CONCAT(e.nombre, ' ', e.apellido_paterno)) AS nombre,
              COALESCE(SUM(v.total), 0) AS valor
       FROM ventas v
       JOIN empleados e ON e.id = v.vendedor_id
       WHERE v.estatus = 'completada' AND v.vendedor_id IS NOT NULL
         AND v.fecha_venta BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
      [r.desde, r.hasta],
    );

    const embudo = await this.dataSource.query(
      `SELECT ${bCot} AS bucket, c.estatus AS estatus, COUNT(*) AS valor
       FROM cotizaciones c
       WHERE c.fecha BETWEEN $1 AND $2
       GROUP BY 1, 2`,
      [r.desde, r.hasta],
    );

    const topProductos = await this.dataSource.query(
      `SELECT p.nombre AS nombre, COALESCE(SUM(dv.cantidad), 0) AS valor
       FROM detalles_venta dv
       JOIN ventas v ON v.id = dv.venta_id
       JOIN productos p ON p.id = dv.producto_id
       WHERE v.estatus = 'completada' AND v.fecha_venta BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
      [r.desde, r.hasta],
    );

    const porCategoria = await this.dataSource.query(
      `SELECT COALESCE(c.nombre, 'Sin categoría') AS nombre,
              COALESCE(SUM(dv.subtotal), 0) AS valor
       FROM detalles_venta dv
       JOIN ventas v ON v.id = dv.venta_id
       JOIN productos p ON p.id = dv.producto_id
       LEFT JOIN categorias_producto c ON c.id = p.categoria_id
       WHERE v.estatus = 'completada' AND v.fecha_venta BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 2 DESC`,
      [r.desde, r.hasta],
    );

    const [kpiMes] = await this.dataSource.query(
      `SELECT COALESCE(SUM(total), 0) AS suma, COUNT(*) AS n
       FROM ventas WHERE estatus = 'completada'
         AND fecha_venta BETWEEN $1 AND $2`,
      [mes.desde, mes.hasta],
    );
    const [kpiPrev] = await this.dataSource.query(
      `SELECT COALESCE(SUM(total), 0) AS suma
       FROM ventas WHERE estatus = 'completada'
         AND fecha_venta BETWEEN $1 AND $2`,
      [prev.desde, prev.hasta],
    );
    const [ticket] = await this.dataSource.query(
      `SELECT COALESCE(AVG(total), 0) AS promedio
       FROM ventas WHERE estatus = 'completada'
         AND fecha_venta BETWEEN $1 AND $2`,
      [r.desde, r.hasta],
    );
    const [pendientes] = await this.dataSource.query(
      `SELECT COUNT(*) AS n FROM cotizaciones WHERE estatus = 'pendiente'`,
    );

    const estadosCot = ['pendiente', 'aprobada', 'rechazada', 'vencida'];
    return {
      kpis: [
        this.kpi(
          'ventasMes',
          'Ventas del mes',
          redondear2(kpiMes.suma),
          'MXN',
          this.variacion(kpiMes.suma, kpiPrev.suma),
        ),
        this.kpi('numVentasMes', 'Ventas del mes (cantidad)', Number(kpiMes.n)),
        this.kpi(
          'ticketPromedio',
          'Ticket promedio del período',
          redondear2(ticket.promedio),
          'MXN',
        ),
        this.kpi(
          'cotizacionesPendientes',
          'Cotizaciones pendientes',
          Number(pendientes.n),
        ),
      ],
      graficas: {
        ingresosPorMes: this.grafica(
          'area',
          r.buckets.map((x) => x.label),
          [
            {
              nombre: 'Ingresos',
              datos: this.serieEnBuckets(r.buckets, ingresos).map(redondear2),
            },
          ],
        ),
        ventasPorVendedor: this.grafica(
          'barras-horizontales',
          porVendedor.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Total',
              datos: porVendedor.map((x: { valor: unknown }) =>
                redondear2(x.valor),
              ),
            },
          ],
        ),
        embudoCotizaciones: this.grafica(
          'barras-apiladas',
          r.buckets.map((x) => x.label),
          this.pivot(r.buckets, embudo, estadosCot),
        ),
        topProductos: this.grafica(
          'barras-horizontales',
          topProductos.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Cantidad',
              datos: topProductos.map((x: { valor: unknown }) =>
                redondear2(x.valor),
              ),
            },
          ],
        ),
        ventasPorCategoria: this.grafica(
          'dona',
          porCategoria.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Subtotal',
              datos: porCategoria.map((x: { valor: unknown }) =>
                redondear2(x.valor),
              ),
            },
          ],
        ),
      },
    };
  }
}
