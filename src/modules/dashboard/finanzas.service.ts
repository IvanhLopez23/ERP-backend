import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardResponseDto, RangoDashboardDto } from './dto';
import {
  claveDia,
  DashboardBaseService,
  parseDia,
  redondear1,
  redondear2,
  sumarDias,
} from './helpers/dashboard-base.service';

interface FilaResultado {
  ingresos: string | number;
  gastos: string | number;
}

interface FilaCobrosPagos {
  cobrado: string | number;
  pagado: string | number;
}

interface FilaFlujo {
  flujo: string | number;
}

interface FilaCartera {
  pendiente: string | number;
  vencida: string | number;
}

interface FilaTipo {
  bucket: string;
  tipo: string;
  valor: string | number;
}

interface FilaSerie {
  bucket: string;
  valor: string | number;
}

interface FilaRango {
  rango: string;
  valor: string | number;
}

interface FilaNombre {
  nombre: string;
  valor: string | number;
}

@Injectable()
export class DashboardFinanzasService extends DashboardBaseService {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async obtenerDashboardFinanzas(
    query: RangoDashboardDto,
  ): Promise<DashboardResponseDto> {
    const r = this.resolverRango(query);
    const previo = this.rangoPrevio(r.desde, r.hasta);
    const hoy = claveDia(new Date());
    const bContable = this.bucketExpr('p.fecha', r.agrupacion);
    const bCobro = this.bucketExpr('cb.fecha', r.agrupacion);
    const bPago = this.bucketExpr('pg.fecha', r.agrupacion);

    const sqlPeriodo = `
      SELECT
        COALESCE(SUM(CASE WHEN c.tipo = 'ingreso' THEN d.haber - d.debe ELSE 0 END), 0) AS ingresos,
        COALESCE(SUM(CASE WHEN c.tipo = 'gasto' THEN d.debe - d.haber ELSE 0 END), 0) AS gastos
        FROM polizas_detalles d
        INNER JOIN polizas p ON p.id = d.poliza_id
        INNER JOIN cuentas_contables c ON c.id = d.cuenta_id
       WHERE p.estatus = 'contabilizada'
         AND p.fecha BETWEEN $1 AND $2
         AND c.tipo IN ('ingreso', 'gasto')`;

    const [
      periodoActual,
      periodoPrevio,
      cobrosPagos,
      flujo,
      carteraCxc,
      carteraCxp,
      ingresosGastos,
      cobrosSerie,
      pagosSerie,
      agingCxc,
      agingCxp,
      topClientes,
      gastosCuenta,
    ] = await Promise.all([
      this.consultar<FilaResultado>(sqlPeriodo, [r.desde, r.hasta]),
      this.consultar<FilaResultado>(sqlPeriodo, [previo.desde, previo.hasta]),
      this.consultar<FilaCobrosPagos>(
        `SELECT
           COALESCE((SELECT SUM(monto) FROM cobros_cxc WHERE fecha BETWEEN $1 AND $2), 0) AS cobrado,
           COALESCE((SELECT SUM(monto) FROM pagos_cxp WHERE fecha BETWEEN $1 AND $2), 0) AS pagado`,
        [r.desde, r.hasta],
      ),
      this.consultar<FilaFlujo>(
        `SELECT COALESCE(SUM(d.debe - d.haber), 0) AS flujo
           FROM polizas_detalles d
           INNER JOIN polizas p ON p.id = d.poliza_id
           INNER JOIN cuentas_contables c ON c.id = d.cuenta_id
          WHERE p.estatus = 'contabilizada'
            AND p.fecha BETWEEN $1 AND $2
            AND c.codigo IN ('1101', '1102', '1106')`,
        [r.desde, r.hasta],
      ),
      this.consultar<FilaCartera>(
        `SELECT
           COALESCE(SUM(saldo) FILTER (
             WHERE estatus IN ('pendiente', 'parcial')
           ), 0) AS pendiente,
           COALESCE(SUM(saldo) FILTER (
             WHERE estatus IN ('pendiente', 'parcial')
               AND fecha_vencimiento < $1
           ), 0) AS vencida
           FROM cuentas_por_cobrar`,
        [hoy],
      ),
      this.consultar<FilaCartera>(
        `SELECT
           COALESCE(SUM(saldo) FILTER (
             WHERE estatus IN ('pendiente', 'parcial')
           ), 0) AS pendiente,
           COALESCE(SUM(saldo) FILTER (
             WHERE estatus IN ('pendiente', 'parcial')
               AND fecha_vencimiento < $1
           ), 0) AS vencida
           FROM cuentas_por_pagar`,
        [hoy],
      ),
      this.consultar<FilaTipo>(
        `SELECT ${bContable} AS bucket, c.tipo AS tipo,
                COALESCE(SUM(
                  CASE WHEN c.tipo = 'ingreso'
                       THEN d.haber - d.debe
                       ELSE d.debe - d.haber END
                ), 0) AS valor
           FROM polizas_detalles d
           INNER JOIN polizas p ON p.id = d.poliza_id
           INNER JOIN cuentas_contables c ON c.id = d.cuenta_id
          WHERE p.estatus = 'contabilizada'
            AND p.fecha BETWEEN $1 AND $2
            AND c.tipo IN ('ingreso', 'gasto')
          GROUP BY 1, 2
          ORDER BY 1`,
        [r.desde, r.hasta],
      ),
      this.consultar<FilaSerie>(
        `SELECT ${bCobro} AS bucket, COALESCE(SUM(cb.monto), 0) AS valor
           FROM cobros_cxc cb
          WHERE cb.fecha BETWEEN $1 AND $2
          GROUP BY 1 ORDER BY 1`,
        [r.desde, r.hasta],
      ),
      this.consultar<FilaSerie>(
        `SELECT ${bPago} AS bucket, COALESCE(SUM(pg.monto), 0) AS valor
           FROM pagos_cxp pg
          WHERE pg.fecha BETWEEN $1 AND $2
          GROUP BY 1 ORDER BY 1`,
        [r.desde, r.hasta],
      ),
      this.consultar<FilaRango>(
        `SELECT
           CASE
             WHEN fecha_vencimiento >= $1 THEN 'corriente'
             WHEN ($1::date - fecha_vencimiento) <= 30 THEN '1-30'
             WHEN ($1::date - fecha_vencimiento) <= 60 THEN '31-60'
             WHEN ($1::date - fecha_vencimiento) <= 90 THEN '61-90'
             ELSE '>90'
           END AS rango,
           COALESCE(SUM(saldo), 0) AS valor
           FROM cuentas_por_cobrar
          WHERE estatus IN ('pendiente', 'parcial') AND saldo > 0
          GROUP BY 1`,
        [hoy],
      ),
      this.consultar<FilaRango>(
        `SELECT
           CASE
             WHEN fecha_vencimiento >= $1 THEN 'corriente'
             WHEN ($1::date - fecha_vencimiento) <= 30 THEN '1-30'
             WHEN ($1::date - fecha_vencimiento) <= 60 THEN '31-60'
             WHEN ($1::date - fecha_vencimiento) <= 90 THEN '61-90'
             ELSE '>90'
           END AS rango,
           COALESCE(SUM(saldo), 0) AS valor
           FROM cuentas_por_pagar
          WHERE estatus IN ('pendiente', 'parcial') AND saldo > 0
          GROUP BY 1`,
        [hoy],
      ),
      this.consultar<FilaNombre>(
        `SELECT cl.nombre AS nombre, COALESCE(SUM(c.saldo), 0) AS valor
           FROM cuentas_por_cobrar c
           INNER JOIN clientes cl ON cl.id = c.cliente_id
          WHERE c.estatus IN ('pendiente', 'parcial') AND c.saldo > 0
          GROUP BY cl.id, cl.nombre
          ORDER BY 2 DESC
          LIMIT 5`,
      ),
      this.consultar<FilaNombre>(
        `SELECT c.codigo || ' ' || c.nombre AS nombre,
                COALESCE(SUM(d.debe - d.haber), 0) AS valor
           FROM polizas_detalles d
           INNER JOIN polizas p ON p.id = d.poliza_id
           INNER JOIN cuentas_contables c ON c.id = d.cuenta_id
          WHERE p.estatus = 'contabilizada'
            AND p.fecha BETWEEN $1 AND $2
            AND c.tipo = 'gasto'
          GROUP BY c.id, c.codigo, c.nombre
         HAVING SUM(d.debe - d.haber) <> 0
          ORDER BY 2 DESC
          LIMIT 8`,
        [r.desde, r.hasta],
      ),
    ]);

    const actual = this.filaUnica(periodoActual);
    const anterior = this.filaUnica(periodoPrevio);
    const ingresos = redondear2(actual.ingresos);
    const gastos = redondear2(actual.gastos);
    const utilidad = redondear2(ingresos - gastos);
    const ingresosPrevios = redondear2(anterior.ingresos);
    const gastosPrevios = redondear2(anterior.gastos);
    const utilidadPrevia = redondear2(ingresosPrevios - gastosPrevios);

    const cobros = this.filaUnica(cobrosPagos).cobrado;
    const pagos = this.filaUnica(cobrosPagos).pagado;
    const carteraPorCobrar = this.filaUnica(carteraCxc);
    const carteraPorPagar = this.filaUnica(carteraCxp);

    const ingresosBuckets = this.serieEnBuckets(
      r.buckets,
      ingresosGastos
        .filter((fila) => fila.tipo === 'ingreso')
        .map((fila) => ({ bucket: fila.bucket, valor: fila.valor })),
    );
    const gastosBuckets = this.serieEnBuckets(
      r.buckets,
      ingresosGastos
        .filter((fila) => fila.tipo === 'gasto')
        .map((fila) => ({ bucket: fila.bucket, valor: fila.valor })),
    );
    const utilidadBuckets = ingresosBuckets.map((valor, indice) =>
      redondear2(valor - gastosBuckets[indice]),
    );

    const agingPorCobrar = this.aging(agingCxc);
    const agingPorPagar = this.aging(agingCxp);

    return {
      kpis: [
        this.kpi(
          'ingresosPeriodo',
          'Ingresos del período',
          ingresos,
          'MXN',
          this.variacion(ingresos, ingresosPrevios),
        ),
        this.kpi(
          'gastosPeriodo',
          'Gastos del período',
          gastos,
          'MXN',
          this.variacion(gastos, gastosPrevios),
        ),
        this.kpi(
          'utilidadPeriodo',
          'Utilidad del período',
          utilidad,
          'MXN',
          this.variacion(utilidad, utilidadPrevia),
        ),
        this.kpi(
          'margenUtilidad',
          'Margen de utilidad',
          ingresos > 0 ? redondear1((utilidad / ingresos) * 100) : 0,
          '%',
        ),
        this.kpi(
          'cobradoPeriodo',
          'Cobrado en el período',
          redondear2(cobros),
          'MXN',
        ),
        this.kpi(
          'pagadoPeriodo',
          'Pagado en el período',
          redondear2(pagos),
          'MXN',
        ),
        this.kpi(
          'flujoNeto',
          'Flujo neto de efectivo',
          redondear2(this.filaUnica(flujo).flujo),
          'MXN',
        ),
        this.kpi(
          'cxcPendiente',
          'Cartera por cobrar pendiente',
          redondear2(carteraPorCobrar.pendiente),
          'MXN',
        ),
        this.kpi(
          'cxcVencida',
          'Cartera por cobrar vencida',
          redondear2(carteraPorCobrar.vencida),
          'MXN',
        ),
        this.kpi(
          'cxpPendiente',
          'Cartera por pagar pendiente',
          redondear2(carteraPorPagar.pendiente),
          'MXN',
        ),
      ],
      graficas: {
        ingresosGastos: this.grafica(
          'barras',
          r.buckets.map((bucket) => bucket.label),
          [
            {
              nombre: 'Ingresos',
              datos: ingresosBuckets.map(redondear2),
            },
            {
              nombre: 'Gastos',
              datos: gastosBuckets.map(redondear2),
            },
            {
              nombre: 'Utilidad',
              datos: utilidadBuckets,
            },
          ],
        ),
        flujoEfectivo: this.grafica(
          'barras',
          r.buckets.map((bucket) => bucket.label),
          [
            {
              nombre: 'Cobros',
              datos: this.serieEnBuckets(r.buckets, cobrosSerie).map(
                redondear2,
              ),
            },
            {
              nombre: 'Pagos',
              datos: this.serieEnBuckets(r.buckets, pagosSerie).map(redondear2),
            },
          ],
        ),
        carteraCxcAntiguedad: this.grafica('dona', agingPorCobrar.labels, [
          { nombre: 'Saldo', datos: agingPorCobrar.datos },
        ]),
        carteraCxpAntiguedad: this.grafica('dona', agingPorPagar.labels, [
          { nombre: 'Saldo', datos: agingPorPagar.datos },
        ]),
        topClientesCartera: this.grafica(
          'barras-horizontales',
          topClientes.map((fila) => fila.nombre),
          [
            {
              nombre: 'Saldo',
              datos: topClientes.map((fila) => redondear2(fila.valor)),
            },
          ],
        ),
        gastosPorCuenta: this.grafica(
          'barras-horizontales',
          gastosCuenta.map((fila) => fila.nombre),
          [
            {
              nombre: 'Importe',
              datos: gastosCuenta.map((fila) => redondear2(fila.valor)),
            },
          ],
        ),
      },
    };
  }

  private async consultar<T>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    return this.dataSource.query(sql, params);
  }

  private filaUnica<T>(filas: T[]): T {
    return (filas[0] ?? {
      ingresos: 0,
      gastos: 0,
      cobrado: 0,
      pagado: 0,
      flujo: 0,
      pendiente: 0,
      vencida: 0,
    }) as T;
  }

  private rangoPrevio(desde: string, hasta: string) {
    const inicio = parseDia(desde);
    const fin = parseDia(hasta);
    const dias = Math.round((fin.getTime() - inicio.getTime()) / 86400000) + 1;
    const previoHasta = sumarDias(inicio, -1);
    const previoDesde = sumarDias(previoHasta, -(dias - 1));
    return {
      desde: claveDia(previoDesde),
      hasta: claveDia(previoHasta),
    };
  }

  private aging(filas: FilaRango[]) {
    const labels = ['corriente', '1-30', '31-60', '61-90', '>90'];
    const valores = new Map(
      filas.map((fila) => [fila.rango, Number(fila.valor) || 0]),
    );
    return {
      labels,
      datos: labels.map((label) => redondear2(valores.get(label) ?? 0)),
    };
  }
}
