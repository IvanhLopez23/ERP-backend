import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardResponseDto, RangoDashboardDto } from './dto';
import {
  DashboardBaseService,
  redondear2,
} from './helpers/dashboard-base.service';

@Injectable()
export class DashboardComprasService extends DashboardBaseService {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async obtenerDashboardCompras(
    query: RangoDashboardDto,
  ): Promise<DashboardResponseDto> {
    const r = this.resolverRango(query);
    const bCompra = this.bucketExpr('c.fecha_compra', r.agrupacion);
    const mes = this.mesActual();
    const prev = this.mesPrevio();

    const egresos = await this.dataSource.query(
      `SELECT ${bCompra} AS bucket, COALESCE(SUM(c.total), 0) AS valor
       FROM compras c
       WHERE c.estatus = 'recibida' AND c.fecha_compra BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 1`,
      [r.desde, r.hasta],
    );

    const porProveedor = await this.dataSource.query(
      `SELECT p.nombre AS nombre, COALESCE(SUM(c.total), 0) AS valor
       FROM compras c
       JOIN proveedores p ON p.id = c.proveedor_id
       WHERE c.estatus = 'recibida' AND c.fecha_compra BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
      [r.desde, r.hasta],
    );

    const porEstatus = await this.dataSource.query(
      `SELECT c.estatus AS nombre, COUNT(*) AS valor
       FROM compras c
       WHERE c.fecha_compra BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 2 DESC`,
      [r.desde, r.hasta],
    );

    const topProductos = await this.dataSource.query(
      `SELECT p.nombre AS nombre, COALESCE(SUM(dc.cantidad), 0) AS valor
       FROM detalles_compra dc
       JOIN compras c ON c.id = dc.compra_id
       JOIN productos p ON p.id = dc.producto_id
       WHERE c.estatus = 'recibida' AND c.fecha_compra BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
      [r.desde, r.hasta],
    );

    const margen = await this.dataSource.query(
      `SELECT p.nombre AS nombre,
              COALESCE(AVG(dc.precio_unitario), 0) AS compra,
              MAX(p.precio_venta) AS venta
       FROM detalles_compra dc
       JOIN compras c ON c.id = dc.compra_id
       JOIN productos p ON p.id = dc.producto_id
       WHERE c.estatus = 'recibida' AND c.fecha_compra BETWEEN $1 AND $2
       GROUP BY p.nombre ORDER BY SUM(dc.subtotal) DESC LIMIT 10`,
      [r.desde, r.hasta],
    );

    const [kpiMes] = await this.dataSource.query(
      `SELECT COALESCE(SUM(total), 0) AS suma
       FROM compras WHERE estatus = 'recibida'
         AND fecha_compra BETWEEN $1 AND $2`,
      [mes.desde, mes.hasta],
    );
    const [kpiPrev] = await this.dataSource.query(
      `SELECT COALESCE(SUM(total), 0) AS suma
       FROM compras WHERE estatus = 'recibida'
         AND fecha_compra BETWEEN $1 AND $2`,
      [prev.desde, prev.hasta],
    );
    const [pendiente] = await this.dataSource.query(
      `SELECT COALESCE(SUM(total), 0) AS suma
       FROM compras WHERE estatus = 'pendiente'`,
    );
    const [proveedores] = await this.dataSource.query(
      `SELECT COUNT(*) AS n FROM proveedores WHERE activo = true`,
    );

    return {
      kpis: [
        this.kpi(
          'comprasMes',
          'Compras del mes',
          redondear2(kpiMes.suma),
          'MXN',
          this.variacion(kpiMes.suma, kpiPrev.suma),
        ),
        this.kpi(
          'pendientePorRecibir',
          'Pendiente por recibir',
          redondear2(pendiente.suma),
          'MXN',
        ),
        this.kpi(
          'proveedoresActivos',
          'Proveedores activos',
          Number(proveedores.n),
        ),
      ],
      graficas: {
        egresosPorMes: this.grafica(
          'area',
          r.buckets.map((x) => x.label),
          [
            {
              nombre: 'Egresos',
              datos: this.serieEnBuckets(r.buckets, egresos).map(redondear2),
            },
          ],
        ),
        comprasPorProveedor: this.grafica(
          'barras-horizontales',
          porProveedor.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Total',
              datos: porProveedor.map((x: { valor: unknown }) =>
                redondear2(x.valor),
              ),
            },
          ],
        ),
        estatusCompras: this.grafica(
          'dona',
          porEstatus.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Compras',
              datos: porEstatus.map((x: { valor: unknown }) => Number(x.valor)),
            },
          ],
        ),
        topProductosComprados: this.grafica(
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
        margenPotencial: this.grafica(
          'barras',
          margen.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Precio compra prom.',
              datos: margen.map((x: { compra: unknown }) =>
                redondear2(x.compra),
              ),
            },
            {
              nombre: 'Precio venta',
              datos: margen.map((x: { venta: unknown }) => redondear2(x.venta)),
            },
          ],
        ),
      },
    };
  }
}
