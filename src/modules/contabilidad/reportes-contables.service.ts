import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReporteContableQueryDto } from './dto/reporte-contable.query.dto';
import { MayorQueryDto } from './dto/mayor.query.dto';
import {
  AuxiliarClientesQueryDto,
  AuxiliarProveedoresQueryDto,
} from './dto/auxiliar.query.dto';
import {
  ExportarReporteQueryDto,
  REPORTES_EXPORTABLES,
  ReporteExportable,
} from './dto/exportar-reporte.query.dto';
import { IvaMensualQueryDto } from './dto/iva-mensual.query.dto';
import { CentroCostoReporteQueryDto } from './dto/centro-costo-reporte.query.dto';
import { PresupuestoCentroReporteQueryDto } from './dto/presupuesto-centro-reporte.query.dto';
import { CentroCosto } from './entities/centro-costo.entity';
import { PresupuestoCentroCosto } from './entities/presupuesto-centro-costo.entity';
import { ReporteCuentaDto } from './dto/reportes.response.dto';
import { PeriodosService } from './periodos.service';
import { CuentaContable } from './entities/cuenta-contable.entity';
import { Cliente } from '../ventas/entities/cliente.entity';
import { Proveedor } from '../compras/entities/proveedor.entity';
import {
  generarExcelReporte,
  generarPdfReporte,
  ReporteExportacion,
} from './helpers/reportes-exportacion';

type SaldoCuenta = ReporteCuentaDto;

interface FilaSaldo {
  codigo: string;
  nombre: string;
  tipo: string;
  naturaleza: string;
  debe: string | number;
  haber: string | number;
}

interface FilaMayor {
  fecha: Date | string;
  folio: string;
  public_id: string;
  concepto: string;
  detalle_concepto: string | null;
  referencia: string | null;
  debe: string | number;
  haber: string | number;
}

interface FilaAperturaContable {
  debe: string | number;
  haber: string | number;
}

interface FilaApertura {
  cargos: string | number;
  abonos: string | number;
}

interface FilaMovimientoAuxiliar {
  fecha: Date | string;
  tipo: string;
  folio: string;
  concepto: string;
  monto: string | number;
}

interface FilaAuxiliarResumen {
  public_id: string;
  codigo: string;
  nombre: string;
  cargos: string | number;
  abonos: string | number;
}

interface FilaIvaMovimiento {
  fecha: Date | string;
  folio: string;
  public_id: string;
  concepto: string;
  codigo: string;
  debe: string | number;
  haber: string | number;
}

interface FilaIvaMes {
  mes: string;
  trasladado: string | number;
  acreditable: string | number;
}

interface FilaCentroCosto {
  centro_id: number | string | null;
  tipo_cuenta: string;
  ingresos: string | number;
  gastos: string | number;
}

interface FilaCentroConteo {
  centro_id: number | string | null;
  movimientos: string | number;
}

interface FilaCentroMovimiento {
  fecha: Date | string;
  folio: string;
  public_id: string;
  concepto: string;
  codigo: string;
  nombre: string;
  tipo: string;
  debe: string | number;
  haber: string | number;
}

interface FilaPresupuestoActual {
  centro_id: number | string | null;
  mes: string | number;
  ingresos: string | number;
  gastos: string | number;
}

export interface TotalesPresupuesto {
  mes: number;
  presupuestoIngresos: number;
  realIngresos: number;
  variacionIngresos: number;
  presupuestoGastos: number;
  realGastos: number;
  variacionGastos: number;
  presupuestoUtilidad: number;
  realUtilidad: number;
  variacionUtilidad: number;
}

@Injectable()
export class ReportesContablesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly periodosService: PeriodosService,
  ) {}

  async balanza(query: ReporteContableQueryDto) {
    const { desde, hasta } = await this.resolverRango(query);
    const cuentas = await this.obtenerSaldos(desde, hasta);

    const totales = cuentas.reduce(
      (acc, cuenta) => {
        acc.debe = this.redondear2(acc.debe + cuenta.debe);
        acc.haber = this.redondear2(acc.haber + cuenta.haber);
        acc.saldoDeudor = this.redondear2(acc.saldoDeudor + cuenta.saldoDeudor);
        acc.saldoAcreedor = this.redondear2(
          acc.saldoAcreedor + cuenta.saldoAcreedor,
        );
        return acc;
      },
      { debe: 0, haber: 0, saldoDeudor: 0, saldoAcreedor: 0 },
    );

    return { desde, hasta, cuentas, totales };
  }

  async estadoResultados(query: ReporteContableQueryDto) {
    const { desde, hasta } = await this.resolverRango(query);
    const saldos = await this.obtenerSaldos(desde, hasta);

    const cuentas = saldos
      .filter((cuenta) => cuenta.tipo === 'ingreso' || cuenta.tipo === 'gasto')
      .map((cuenta) => {
        const importe =
          cuenta.tipo === 'ingreso'
            ? this.redondear2(cuenta.haber - cuenta.debe)
            : this.redondear2(cuenta.debe - cuenta.haber);
        return {
          ...cuenta,
          saldo: importe,
          saldoDeudor: cuenta.tipo === 'gasto' ? Math.max(importe, 0) : 0,
          saldoAcreedor: cuenta.tipo === 'ingreso' ? Math.max(importe, 0) : 0,
        };
      });

    const ingresos = this.sumar(
      cuentas.filter((cuenta) => cuenta.tipo === 'ingreso'),
    );
    const gastos = this.sumar(
      cuentas.filter((cuenta) => cuenta.tipo === 'gasto'),
    );
    const utilidad = this.redondear2(ingresos - gastos);

    return { desde, hasta, ingresos, gastos, utilidad, cuentas };
  }

  async balanceGeneral(query: ReporteContableQueryDto) {
    const { desde, hasta } = await this.resolverRango(query);
    const saldos = await this.obtenerSaldos(desde, hasta);

    const activo = this.seccion(
      saldos.filter((cuenta) => cuenta.tipo === 'activo'),
      'deudora',
    );
    const pasivo = this.seccion(
      saldos.filter((cuenta) => cuenta.tipo === 'pasivo'),
      'acreedora',
    );
    const capital = this.seccion(
      saldos.filter((cuenta) => cuenta.tipo === 'capital'),
      'acreedora',
    );

    const ingresos = this.redondear2(
      saldos
        .filter((cuenta) => cuenta.tipo === 'ingreso')
        .reduce((total, cuenta) => total + (cuenta.haber - cuenta.debe), 0),
    );
    const gastos = this.redondear2(
      saldos
        .filter((cuenta) => cuenta.tipo === 'gasto')
        .reduce((total, cuenta) => total + (cuenta.debe - cuenta.haber), 0),
    );
    const utilidad = this.redondear2(ingresos - gastos);
    const totalPasivoCapital = this.redondear2(
      pasivo.total + capital.total + utilidad,
    );

    return {
      desde,
      hasta,
      activo,
      pasivo,
      capital,
      resultados: { ingresos, gastos, utilidad },
      totalActivo: activo.total,
      totalPasivoCapital,
      cuadra: activo.total === totalPasivoCapital,
    };
  }

  async mayor(query: MayorQueryDto) {
    const { desde, hasta } = await this.resolverRango(query);
    const cuenta = await this.dataSource.getRepository(CuentaContable).findOne({
      where: { publicId: query.cuentaId },
    });
    if (!cuenta) {
      throw new BadRequestException(
        `La cuenta contable ${query.cuentaId} no existe`,
      );
    }

    const apertura: FilaAperturaContable[] = await this.dataSource.query(
      `SELECT COALESCE(SUM(d.debe), 0) AS debe,
              COALESCE(SUM(d.haber), 0) AS haber
         FROM polizas_detalles d
         INNER JOIN polizas p ON p.id = d.poliza_id
        WHERE p.estatus = 'contabilizada'
          AND d.cuenta_id = $1
          AND p.fecha < $2`,
      [cuenta.id, desde],
    );

    const filas: FilaMayor[] = await this.dataSource.query(
      `SELECT p.fecha, p.folio, p.public_id, p.concepto,
              d.concepto AS detalle_concepto, d.referencia, d.debe, d.haber
         FROM polizas_detalles d
         INNER JOIN polizas p ON p.id = d.poliza_id
        WHERE p.estatus = 'contabilizada'
          AND d.cuenta_id = $1
          AND p.fecha BETWEEN $2 AND $3
        ORDER BY p.fecha ASC, p.id ASC, d.orden ASC`,
      [cuenta.id, desde, hasta],
    );

    const signo = cuenta.naturaleza === 'acreedora' ? -1 : 1;
    const saldoInicial = this.redondear2(
      signo *
        (Number(apertura[0]?.debe ?? 0) - Number(apertura[0]?.haber ?? 0)),
    );

    let saldo = saldoInicial;
    const movimientos = filas.map((fila) => {
      const debe = this.redondear2(Number(fila.debe) || 0);
      const haber = this.redondear2(Number(fila.haber) || 0);
      saldo = this.redondear2(saldo + signo * (debe - haber));
      return {
        fecha: this.fechaDb(fila.fecha),
        folio: fila.folio,
        polizaId: fila.public_id,
        concepto: fila.detalle_concepto || fila.concepto,
        referencia: fila.referencia ?? null,
        debe,
        haber,
        saldo,
      };
    });

    const totales = movimientos.reduce(
      (acc, movimiento) => ({
        debe: this.redondear2(acc.debe + movimiento.debe),
        haber: this.redondear2(acc.haber + movimiento.haber),
      }),
      { debe: 0, haber: 0 },
    );

    return {
      desde,
      hasta,
      cuenta: {
        publicId: cuenta.publicId,
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        naturaleza: cuenta.naturaleza,
      },
      saldoInicial,
      movimientos,
      totales: { ...totales, saldoFinal: saldo },
    };
  }

  async auxiliarClientes(query: AuxiliarClientesQueryDto) {
    const { desde, hasta } = await this.resolverRango(query);
    if (!query.clienteId) {
      return this.resumenAuxiliar('clientes', desde, hasta);
    }

    const cliente = await this.dataSource.getRepository(Cliente).findOne({
      where: { publicId: query.clienteId },
    });
    if (!cliente) {
      throw new BadRequestException(`El cliente ${query.clienteId} no existe`);
    }

    const apertura: FilaApertura[] = await this.dataSource.query(
      `SELECT
         COALESCE((
           SELECT SUM(c.monto) FROM cuentas_por_cobrar c
            WHERE c.cliente_id = $1 AND c.estatus <> 'cancelada'
              AND c.fecha_emision < $2
         ), 0) AS cargos,
         COALESCE((
           SELECT SUM(cb.monto)
             FROM cobros_cxc cb
             INNER JOIN cuentas_por_cobrar c ON c.id = cb.cuenta_por_cobrar_id
            WHERE c.cliente_id = $1 AND c.estatus <> 'cancelada'
              AND cb.fecha < $2
         ), 0) AS abonos`,
      [cliente.id, desde],
    );
    const saldoInicial = this.redondear2(
      Number(apertura[0]?.cargos ?? 0) - Number(apertura[0]?.abonos ?? 0),
    );

    const filas: FilaMovimientoAuxiliar[] = await this.dataSource.query(
      `SELECT fecha, tipo, folio, concepto, monto
         FROM (
           SELECT c.fecha_emision AS fecha, 'cargo' AS tipo, c.folio AS folio,
                  'Cuenta por cobrar ' || c.folio AS concepto,
                  c.monto AS monto, c.id AS orden_id, 0 AS prioridad
             FROM cuentas_por_cobrar c
            WHERE c.cliente_id = $1 AND c.estatus <> 'cancelada'
              AND c.fecha_emision BETWEEN $2 AND $3
           UNION ALL
           SELECT cb.fecha, 'abono', c.folio,
                  'Cobro (' || cb.metodo_pago || ')' ||
                    COALESCE(' · ' || cb.referencia, ''),
                  cb.monto, cb.id, 1
             FROM cobros_cxc cb
             INNER JOIN cuentas_por_cobrar c ON c.id = cb.cuenta_por_cobrar_id
            WHERE c.cliente_id = $1 AND c.estatus <> 'cancelada'
              AND cb.fecha BETWEEN $2 AND $3
         ) movimientos
        ORDER BY fecha ASC, prioridad ASC, orden_id ASC`,
      [cliente.id, desde, hasta],
    );

    let saldo = saldoInicial;
    const movimientos = filas.map((fila) => {
      const monto = this.redondear2(Number(fila.monto) || 0);
      saldo = this.redondear2(saldo + (fila.tipo === 'cargo' ? monto : -monto));
      return {
        fecha: this.fechaDb(fila.fecha),
        tipo: fila.tipo,
        folio: fila.folio,
        concepto: fila.concepto,
        monto,
        saldo,
      };
    });

    const cargos = this.redondear2(
      movimientos
        .filter((movimiento) => movimiento.tipo === 'cargo')
        .reduce((total, movimiento) => total + movimiento.monto, 0),
    );
    const abonos = this.redondear2(
      movimientos
        .filter((movimiento) => movimiento.tipo === 'abono')
        .reduce((total, movimiento) => total + movimiento.monto, 0),
    );

    return {
      desde,
      hasta,
      cliente: {
        publicId: cliente.publicId,
        codigo: cliente.codigo,
        nombre: cliente.nombre,
      },
      saldoInicial,
      movimientos,
      totales: { cargos, abonos, saldoFinal: saldo },
    };
  }

  async auxiliarProveedores(query: AuxiliarProveedoresQueryDto) {
    const { desde, hasta } = await this.resolverRango(query);
    if (!query.proveedorId) {
      return this.resumenAuxiliar('proveedores', desde, hasta);
    }

    const proveedor = await this.dataSource.getRepository(Proveedor).findOne({
      where: { publicId: query.proveedorId },
    });
    if (!proveedor) {
      throw new BadRequestException(
        `El proveedor ${query.proveedorId} no existe`,
      );
    }

    const apertura: FilaApertura[] = await this.dataSource.query(
      `SELECT
         COALESCE((
           SELECT SUM(pg.monto)
             FROM pagos_cxp pg
             INNER JOIN cuentas_por_pagar p ON p.id = pg.cuenta_por_pagar_id
            WHERE p.proveedor_id = $1 AND p.estatus <> 'cancelada'
              AND pg.fecha < $2
         ), 0) AS cargos,
         COALESCE((
           SELECT SUM(p.monto) FROM cuentas_por_pagar p
            WHERE p.proveedor_id = $1 AND p.estatus <> 'cancelada'
              AND p.fecha_emision < $2
         ), 0) AS abonos`,
      [proveedor.id, desde],
    );
    const saldoInicial = this.redondear2(
      Number(apertura[0]?.abonos ?? 0) - Number(apertura[0]?.cargos ?? 0),
    );

    const filas: FilaMovimientoAuxiliar[] = await this.dataSource.query(
      `SELECT fecha, tipo, folio, concepto, monto
         FROM (
           SELECT p.fecha_emision AS fecha, 'abono' AS tipo, p.folio AS folio,
                  'Cuenta por pagar ' || p.folio AS concepto,
                  p.monto AS monto, p.id AS orden_id, 0 AS prioridad
             FROM cuentas_por_pagar p
            WHERE p.proveedor_id = $1 AND p.estatus <> 'cancelada'
              AND p.fecha_emision BETWEEN $2 AND $3
           UNION ALL
           SELECT pg.fecha, 'cargo', p.folio,
                  'Pago (' || pg.metodo_pago || ')' ||
                    COALESCE(' · ' || pg.referencia, ''),
                  pg.monto, pg.id, 1
             FROM pagos_cxp pg
             INNER JOIN cuentas_por_pagar p ON p.id = pg.cuenta_por_pagar_id
            WHERE p.proveedor_id = $1 AND p.estatus <> 'cancelada'
              AND pg.fecha BETWEEN $2 AND $3
         ) movimientos
        ORDER BY fecha ASC, prioridad ASC, orden_id ASC`,
      [proveedor.id, desde, hasta],
    );

    let saldo = saldoInicial;
    const movimientos = filas.map((fila) => {
      const monto = this.redondear2(Number(fila.monto) || 0);
      saldo = this.redondear2(saldo + (fila.tipo === 'abono' ? monto : -monto));
      return {
        fecha: this.fechaDb(fila.fecha),
        tipo: fila.tipo,
        folio: fila.folio,
        concepto: fila.concepto,
        monto,
        saldo,
      };
    });

    const cargos = this.redondear2(
      movimientos
        .filter((movimiento) => movimiento.tipo === 'cargo')
        .reduce((total, movimiento) => total + movimiento.monto, 0),
    );
    const abonos = this.redondear2(
      movimientos
        .filter((movimiento) => movimiento.tipo === 'abono')
        .reduce((total, movimiento) => total + movimiento.monto, 0),
    );

    return {
      desde,
      hasta,
      proveedor: {
        publicId: proveedor.publicId,
        codigo: proveedor.codigo,
        nombre: proveedor.nombre,
      },
      saldoInicial,
      movimientos,
      totales: { cargos, abonos, saldoFinal: saldo },
    };
  }

  private async resumenAuxiliar(
    tipo: 'clientes' | 'proveedores',
    desde: string,
    hasta: string,
  ) {
    const esClientes = tipo === 'clientes';
    const filas: FilaAuxiliarResumen[] = esClientes
      ? await this.dataSource.query(
          `WITH cargos AS (
             SELECT c.cliente_id, SUM(c.monto) AS total
               FROM cuentas_por_cobrar c
              WHERE c.estatus <> 'cancelada'
                AND c.fecha_emision BETWEEN $1 AND $2
              GROUP BY c.cliente_id
           ), abonos AS (
             SELECT c.cliente_id, SUM(cb.monto) AS total
               FROM cobros_cxc cb
               INNER JOIN cuentas_por_cobrar c ON c.id = cb.cuenta_por_cobrar_id
              WHERE c.estatus <> 'cancelada'
                AND cb.fecha BETWEEN $1 AND $2
              GROUP BY c.cliente_id
           )
           SELECT cl.public_id, cl.codigo, cl.nombre,
                  COALESCE(ca.total, 0) AS cargos,
                  COALESCE(ab.total, 0) AS abonos
             FROM clientes cl
             LEFT JOIN cargos ca ON ca.cliente_id = cl.id
             LEFT JOIN abonos ab ON ab.cliente_id = cl.id
            WHERE COALESCE(ca.total, 0) <> 0 OR COALESCE(ab.total, 0) <> 0
            ORDER BY cl.nombre ASC`,
          [desde, hasta],
        )
      : await this.dataSource.query(
          `WITH cargos AS (
             SELECT p.proveedor_id, SUM(pg.monto) AS total
               FROM pagos_cxp pg
               INNER JOIN cuentas_por_pagar p ON p.id = pg.cuenta_por_pagar_id
              WHERE p.estatus <> 'cancelada'
                AND pg.fecha BETWEEN $1 AND $2
              GROUP BY p.proveedor_id
           ), abonos AS (
             SELECT p.proveedor_id, SUM(p.monto) AS total
               FROM cuentas_por_pagar p
              WHERE p.estatus <> 'cancelada'
                AND p.fecha_emision BETWEEN $1 AND $2
              GROUP BY p.proveedor_id
           )
           SELECT pr.public_id, pr.codigo, pr.nombre,
                  COALESCE(ca.total, 0) AS cargos,
                  COALESCE(ab.total, 0) AS abonos
             FROM proveedores pr
             LEFT JOIN cargos ca ON ca.proveedor_id = pr.id
             LEFT JOIN abonos ab ON ab.proveedor_id = pr.id
            WHERE COALESCE(ca.total, 0) <> 0 OR COALESCE(ab.total, 0) <> 0
            ORDER BY pr.nombre ASC`,
          [desde, hasta],
        );

    const items = filas.map((fila) => {
      const cargos = this.redondear2(Number(fila.cargos) || 0);
      const abonos = this.redondear2(Number(fila.abonos) || 0);
      return {
        publicId: fila.public_id,
        codigo: fila.codigo,
        nombre: fila.nombre,
        cargos,
        abonos,
        saldo: this.redondear2(esClientes ? cargos - abonos : abonos - cargos),
      };
    });

    const totales = items.reduce(
      (acc, item) => ({
        cargos: this.redondear2(acc.cargos + item.cargos),
        abonos: this.redondear2(acc.abonos + item.abonos),
        saldo: this.redondear2(acc.saldo + item.saldo),
      }),
      { cargos: 0, abonos: 0, saldo: 0 },
    );

    return esClientes
      ? { desde, hasta, clientes: items, totales }
      : { desde, hasta, proveedores: items, totales };
  }

  async iva(query: ReporteContableQueryDto) {
    const { desde, hasta } = await this.resolverRango(query);
    const filas: FilaIvaMovimiento[] = await this.dataSource.query(
      `SELECT p.fecha, p.folio, p.public_id, p.concepto,
              c.codigo, d.debe, d.haber
         FROM polizas_detalles d
         INNER JOIN polizas p ON p.id = d.poliza_id
         INNER JOIN cuentas_contables c ON c.id = d.cuenta_id
        WHERE p.estatus = 'contabilizada'
          AND p.fecha BETWEEN $1 AND $2
          AND c.codigo IN ('2102', '1104')
          AND NOT EXISTS (
            SELECT 1 FROM declaraciones_iva dcl
            WHERE dcl.poliza_id = p.id
          )
        ORDER BY p.fecha ASC, p.id ASC, d.orden ASC`,
      [desde, hasta],
    );

    const movimientos = filas.map((fila) => {
      const debe = this.redondear2(Number(fila.debe) || 0);
      const haber = this.redondear2(Number(fila.haber) || 0);
      const esTrasladado = fila.codigo === '2102';
      return {
        fecha: this.fechaDb(fila.fecha),
        folio: fila.folio,
        polizaId: fila.public_id,
        concepto: fila.concepto,
        tipo: esTrasladado ? 'trasladado' : 'acreditable',
        cuenta: fila.codigo,
        debe,
        haber,
        importe: esTrasladado
          ? this.redondear2(haber - debe)
          : this.redondear2(debe - haber),
      };
    });

    const trasladado = this.redondear2(
      movimientos
        .filter((movimiento) => movimiento.tipo === 'trasladado')
        .reduce((total, movimiento) => total + movimiento.importe, 0),
    );
    const acreditable = this.redondear2(
      movimientos
        .filter((movimiento) => movimiento.tipo === 'acreditable')
        .reduce((total, movimiento) => total + movimiento.importe, 0),
    );
    const neto = this.redondear2(trasladado - acreditable);

    return {
      desde,
      hasta,
      trasladado,
      acreditable,
      neto,
      porPagar: Math.max(neto, 0),
      saldoFavor: Math.max(-neto, 0),
      movimientos,
    };
  }

  async ivaMensual(query: IvaMensualQueryDto) {
    const anio = query.anio ?? new Date().getFullYear();
    const desde = `${anio}-01-01`;
    const hasta = `${anio}-12-31`;
    const filas: FilaIvaMes[] = await this.dataSource.query(
      `SELECT to_char(p.fecha, 'YYYY-MM') AS mes,
              COALESCE(SUM(
                CASE WHEN c.codigo = '2102' THEN d.haber - d.debe ELSE 0 END
              ), 0) AS trasladado,
              COALESCE(SUM(
                CASE WHEN c.codigo = '1104' THEN d.debe - d.haber ELSE 0 END
              ), 0) AS acreditable
         FROM polizas_detalles d
         INNER JOIN polizas p ON p.id = d.poliza_id
         INNER JOIN cuentas_contables c ON c.id = d.cuenta_id
        WHERE p.estatus = 'contabilizada'
          AND p.fecha BETWEEN $1 AND $2
          AND c.codigo IN ('2102', '1104')
          AND NOT EXISTS (
            SELECT 1 FROM declaraciones_iva dcl
            WHERE dcl.poliza_id = p.id
          )
        GROUP BY 1
        ORDER BY 1`,
      [desde, hasta],
    );

    const mapa = new Map(filas.map((fila) => [fila.mes, fila]));
    const meses = Array.from({ length: 12 }, (_, indice) => {
      const mes = `${anio}-${String(indice + 1).padStart(2, '0')}`;
      const fila = mapa.get(mes);
      const trasladado = this.redondear2(Number(fila?.trasladado) || 0);
      const acreditable = this.redondear2(Number(fila?.acreditable) || 0);
      const neto = this.redondear2(trasladado - acreditable);
      return {
        mes,
        trasladado,
        acreditable,
        neto,
        porPagar: Math.max(neto, 0),
        saldoFavor: Math.max(-neto, 0),
      };
    });

    const totales = meses.reduce(
      (acc, mes) => ({
        trasladado: this.redondear2(acc.trasladado + mes.trasladado),
        acreditable: this.redondear2(acc.acreditable + mes.acreditable),
        neto: this.redondear2(acc.neto + mes.neto),
        porPagar: this.redondear2(acc.porPagar + mes.porPagar),
        saldoFavor: this.redondear2(acc.saldoFavor + mes.saldoFavor),
      }),
      {
        trasladado: 0,
        acreditable: 0,
        neto: 0,
        porPagar: 0,
        saldoFavor: 0,
      },
    );

    return { anio, meses, totales };
  }

  async centrosCosto(query: CentroCostoReporteQueryDto) {
    const { desde, hasta } = await this.resolverRango(query);
    const filas: FilaCentroCosto[] = await this.dataSource.query(
      `SELECT COALESCE(d.centro_costo_id, p.centro_costo_id) AS centro_id,
              c.tipo AS tipo_cuenta,
              COALESCE(SUM(
                CASE WHEN c.tipo = 'ingreso' THEN d.haber - d.debe ELSE 0 END
              ), 0) AS ingresos,
              COALESCE(SUM(
                CASE WHEN c.tipo = 'gasto' THEN d.debe - d.haber ELSE 0 END
              ), 0) AS gastos
         FROM polizas_detalles d
         INNER JOIN polizas p ON p.id = d.poliza_id
         INNER JOIN cuentas_contables c ON c.id = d.cuenta_id
        WHERE p.estatus = 'contabilizada'
          AND p.fecha BETWEEN $1 AND $2
          AND c.tipo IN ('ingreso', 'gasto')
        GROUP BY 1, 2`,
      [desde, hasta],
    );

    const conteos: FilaCentroConteo[] = await this.dataSource.query(
      `SELECT COALESCE(d.centro_costo_id, p.centro_costo_id) AS centro_id,
              COUNT(DISTINCT p.id) AS movimientos
         FROM polizas_detalles d
         INNER JOIN polizas p ON p.id = d.poliza_id
         INNER JOIN cuentas_contables c ON c.id = d.cuenta_id
        WHERE p.estatus = 'contabilizada'
          AND p.fecha BETWEEN $1 AND $2
          AND c.tipo IN ('ingreso', 'gasto')
        GROUP BY 1`,
      [desde, hasta],
    );

    const centros = await this.dataSource.getRepository(CentroCosto).find({
      order: { codigo: 'ASC' },
    });
    const actividad = new Map<number, { ingresos: number; gastos: number }>();
    let sinCentro = { ingresos: 0, gastos: 0 };

    for (const fila of filas) {
      const centroId =
        fila.centro_id === null || fila.centro_id === undefined
          ? null
          : Number(fila.centro_id);
      const actual =
        centroId === null
          ? sinCentro
          : (actividad.get(centroId) ?? { ingresos: 0, gastos: 0 });
      actual.ingresos = this.redondear2(
        actual.ingresos + (Number(fila.ingresos) || 0),
      );
      actual.gastos = this.redondear2(
        actual.gastos + (Number(fila.gastos) || 0),
      );
      if (centroId === null) sinCentro = actual;
      else actividad.set(centroId, actual);
    }

    const conteoMap = new Map<number | null, number>();
    for (const fila of conteos) {
      const centroId =
        fila.centro_id === null || fila.centro_id === undefined
          ? null
          : Number(fila.centro_id);
      conteoMap.set(centroId, Number(fila.movimientos) || 0);
    }

    const centrosReporte: Array<{
      centroCostoId: string | null;
      codigo: string | null;
      nombre: string;
      tipo: string | null;
      ingresos: number;
      gastos: number;
      utilidad: number;
      movimientos: number;
    }> = centros
      .filter((centro) => !query.tipo || centro.tipo === query.tipo)
      .map((centro) => {
        const actual = actividad.get(centro.id) ?? { ingresos: 0, gastos: 0 };
        const ingresos = this.redondear2(actual.ingresos);
        const gastos = this.redondear2(actual.gastos);
        return {
          centroCostoId: centro.publicId,
          codigo: centro.codigo,
          nombre: centro.nombre,
          tipo: centro.tipo,
          ingresos,
          gastos,
          utilidad: this.redondear2(ingresos - gastos),
          movimientos: conteoMap.get(centro.id) ?? 0,
        };
      });

    if (!query.tipo) {
      const ingresos = this.redondear2(sinCentro.ingresos);
      const gastos = this.redondear2(sinCentro.gastos);
      const movimientos = conteoMap.get(null) ?? 0;
      if (ingresos !== 0 || gastos !== 0 || movimientos > 0) {
        centrosReporte.push({
          centroCostoId: null,
          codigo: null,
          nombre: 'Sin centro de costo',
          tipo: null,
          ingresos,
          gastos,
          utilidad: this.redondear2(ingresos - gastos),
          movimientos,
        });
      }
    }

    const totales = centrosReporte.reduce(
      (acc, fila) => ({
        ingresos: this.redondear2(acc.ingresos + fila.ingresos),
        gastos: this.redondear2(acc.gastos + fila.gastos),
        utilidad: this.redondear2(acc.utilidad + fila.utilidad),
      }),
      { ingresos: 0, gastos: 0, utilidad: 0 },
    );

    return { desde, hasta, centros: centrosReporte, totales };
  }

  async centrosCostoDetalle(
    publicId: string,
    query: CentroCostoReporteQueryDto,
  ) {
    const { desde, hasta } = await this.resolverRango(query);
    const centro = await this.dataSource.getRepository(CentroCosto).findOne({
      where: { publicId },
    });
    if (!centro) {
      throw new BadRequestException(`El centro de costo ${publicId} no existe`);
    }

    const filas: FilaCentroMovimiento[] = await this.dataSource.query(
      `SELECT p.fecha, p.folio, p.public_id, p.concepto,
              c.codigo, c.nombre, c.tipo, d.debe, d.haber
         FROM polizas_detalles d
         INNER JOIN polizas p ON p.id = d.poliza_id
         INNER JOIN cuentas_contables c ON c.id = d.cuenta_id
        WHERE COALESCE(d.centro_costo_id, p.centro_costo_id) = $1
          AND p.estatus = 'contabilizada'
          AND p.fecha BETWEEN $2 AND $3
          AND c.tipo IN ('ingreso', 'gasto')
        ORDER BY p.fecha ASC, p.id ASC, d.orden ASC`,
      [centro.id, desde, hasta],
    );

    const movimientos = filas.map((fila) => {
      const debe = this.redondear2(Number(fila.debe) || 0);
      const haber = this.redondear2(Number(fila.haber) || 0);
      return {
        fecha: this.fechaDb(fila.fecha),
        folio: fila.folio,
        polizaId: fila.public_id,
        concepto: fila.concepto,
        cuenta: fila.codigo,
        cuentaNombre: fila.nombre,
        tipo: fila.tipo,
        debe,
        haber,
        importe: this.redondear2(
          fila.tipo === 'ingreso' ? haber - debe : debe - haber,
        ),
      };
    });

    const ingresos = this.redondear2(
      movimientos
        .filter((movimiento) => movimiento.tipo === 'ingreso')
        .reduce((total, movimiento) => total + movimiento.importe, 0),
    );
    const gastos = this.redondear2(
      movimientos
        .filter((movimiento) => movimiento.tipo === 'gasto')
        .reduce((total, movimiento) => total + movimiento.importe, 0),
    );

    return {
      desde,
      hasta,
      centro,
      movimientos,
      totales: {
        ingresos,
        gastos,
        utilidad: this.redondear2(ingresos - gastos),
      },
    };
  }

  async presupuestoCentrosCosto(query: PresupuestoCentroReporteQueryDto) {
    const anio = query.anio ?? new Date().getFullYear();
    const desde = `${anio}-01-01`;
    const hasta = `${anio}-12-31`;

    const [presupuestos, centros, filasActuales] = (await Promise.all([
      this.dataSource.getRepository(PresupuestoCentroCosto).find({
        where: { anio },
        relations: { centroCosto: true },
      }),
      this.dataSource.getRepository(CentroCosto).find({
        order: { codigo: 'ASC' },
      }),
      this.dataSource.query(
        `SELECT COALESCE(d.centro_costo_id, p.centro_costo_id) AS centro_id,
                EXTRACT(MONTH FROM p.fecha)::int AS mes,
                COALESCE(SUM(
                  CASE WHEN c.tipo = 'ingreso' THEN d.haber - d.debe ELSE 0 END
                ), 0) AS ingresos,
                COALESCE(SUM(
                  CASE WHEN c.tipo = 'gasto' THEN d.debe - d.haber ELSE 0 END
                ), 0) AS gastos
           FROM polizas_detalles d
           INNER JOIN polizas p ON p.id = d.poliza_id
           INNER JOIN cuentas_contables c ON c.id = d.cuenta_id
          WHERE p.estatus = 'contabilizada'
            AND p.fecha BETWEEN $1 AND $2
            AND c.tipo IN ('ingreso', 'gasto')
          GROUP BY 1, 2`,
        [desde, hasta],
      ),
    ])) as [PresupuestoCentroCosto[], CentroCosto[], FilaPresupuestoActual[]];

    const presupuestoMap = new Map<
      string,
      { ingresos: number; gastos: number }
    >();
    for (const presupuesto of presupuestos) {
      presupuestoMap.set(`${presupuesto.centroCostoId}-${presupuesto.mes}`, {
        ingresos: Number(presupuesto.ingresosPresupuestados) || 0,
        gastos: Number(presupuesto.gastosPresupuestados) || 0,
      });
    }

    const actualMap = new Map<string, { ingresos: number; gastos: number }>();
    for (const fila of filasActuales) {
      const centroKey =
        fila.centro_id === null || fila.centro_id === undefined
          ? 'null'
          : String(Number(fila.centro_id));
      const key = `${centroKey}-${Number(fila.mes)}`;
      const actual = actualMap.get(key) ?? { ingresos: 0, gastos: 0 };
      actual.ingresos += Number(fila.ingresos) || 0;
      actual.gastos += Number(fila.gastos) || 0;
      actualMap.set(key, actual);
    }

    let centrosFiltrados: CentroCosto[];
    if (query.centroCostoId) {
      const centro = await this.dataSource
        .getRepository(CentroCosto)
        .findOne({ where: { publicId: query.centroCostoId } });
      if (!centro) {
        throw new BadRequestException(
          `El centro de costo ${query.centroCostoId} no existe`,
        );
      }
      centrosFiltrados = [centro];
    } else {
      const idsConDatos = new Set<number>();
      for (const presupuesto of presupuestos) {
        idsConDatos.add(presupuesto.centroCostoId);
      }
      for (const fila of filasActuales) {
        if (fila.centro_id !== null && fila.centro_id !== undefined) {
          idsConDatos.add(Number(fila.centro_id));
        }
      }
      centrosFiltrados = centros.filter(
        (centro) =>
          (!query.tipo || centro.tipo === query.tipo) &&
          idsConDatos.has(centro.id),
      );
    }

    const centrosReporte = centrosFiltrados.map((centro) =>
      this.construirFilaPresupuesto(centro, presupuestoMap, actualMap),
    );

    const incluirSinCentro =
      !query.centroCostoId &&
      !query.tipo &&
      filasActuales.some(
        (fila) => fila.centro_id === null || fila.centro_id === undefined,
      );
    if (incluirSinCentro) {
      centrosReporte.push(
        this.construirFilaPresupuesto(null, presupuestoMap, actualMap),
      );
    }

    const totales = this.sumarTotalesPresupuesto(
      centrosReporte.map((centro) => centro.totales),
    );

    return { anio, centros: centrosReporte, totales };
  }

  private construirFilaPresupuesto(
    centro: CentroCosto | null,
    presupuestoMap: Map<string, { ingresos: number; gastos: number }>,
    actualMap: Map<string, { ingresos: number; gastos: number }>,
  ) {
    const keyCentro = centro ? String(centro.id) : 'null';
    const meses = Array.from({ length: 12 }, (_, indice) => {
      const mes = indice + 1;
      const presupuesto = presupuestoMap.get(`${keyCentro}-${mes}`) ?? {
        ingresos: 0,
        gastos: 0,
      };
      const actual = actualMap.get(`${keyCentro}-${mes}`) ?? {
        ingresos: 0,
        gastos: 0,
      };

      const presupuestoIngresos = this.redondear2(presupuesto.ingresos);
      const presupuestoGastos = this.redondear2(presupuesto.gastos);
      const realIngresos = this.redondear2(actual.ingresos);
      const realGastos = this.redondear2(actual.gastos);
      const presupuestoUtilidad = this.redondear2(
        presupuestoIngresos - presupuestoGastos,
      );
      const realUtilidad = this.redondear2(realIngresos - realGastos);

      return {
        mes,
        presupuestoIngresos,
        realIngresos,
        variacionIngresos: this.redondear2(realIngresos - presupuestoIngresos),
        presupuestoGastos,
        realGastos,
        variacionGastos: this.redondear2(realGastos - presupuestoGastos),
        presupuestoUtilidad,
        realUtilidad,
        variacionUtilidad: this.redondear2(realUtilidad - presupuestoUtilidad),
      };
    });

    const totales = this.sumarTotalesPresupuesto(meses);

    return {
      centroCostoId: centro?.publicId ?? null,
      codigo: centro?.codigo ?? null,
      nombre: centro?.nombre ?? 'Sin centro de costo',
      tipo: centro?.tipo ?? null,
      meses,
      totales,
    };
  }

  private sumarTotalesPresupuesto(
    filas: Array<Omit<TotalesPresupuesto, 'mes'>>,
  ): TotalesPresupuesto {
    return filas.reduce<TotalesPresupuesto>(
      (acc, fila) => ({
        mes: 0,
        presupuestoIngresos: this.redondear2(
          acc.presupuestoIngresos + fila.presupuestoIngresos,
        ),
        realIngresos: this.redondear2(acc.realIngresos + fila.realIngresos),
        variacionIngresos: this.redondear2(
          acc.variacionIngresos + fila.variacionIngresos,
        ),
        presupuestoGastos: this.redondear2(
          acc.presupuestoGastos + fila.presupuestoGastos,
        ),
        realGastos: this.redondear2(acc.realGastos + fila.realGastos),
        variacionGastos: this.redondear2(
          acc.variacionGastos + fila.variacionGastos,
        ),
        presupuestoUtilidad: this.redondear2(
          acc.presupuestoUtilidad + fila.presupuestoUtilidad,
        ),
        realUtilidad: this.redondear2(acc.realUtilidad + fila.realUtilidad),
        variacionUtilidad: this.redondear2(
          acc.variacionUtilidad + fila.variacionUtilidad,
        ),
      }),
      {
        mes: 0,
        presupuestoIngresos: 0,
        realIngresos: 0,
        variacionIngresos: 0,
        presupuestoGastos: 0,
        realGastos: 0,
        variacionGastos: 0,
        presupuestoUtilidad: 0,
        realUtilidad: 0,
        variacionUtilidad: 0,
      },
    );
  }

  async exportar(reporte: string, query: ExportarReporteQueryDto) {
    if (!REPORTES_EXPORTABLES.includes(reporte as ReporteExportable)) {
      throw new BadRequestException(
        `El reporte ${reporte} no se puede exportar`,
      );
    }

    const formato = query.formato ?? 'xlsx';
    const modelo = await this.construirExportacion(
      reporte as ReporteExportable,
      query,
    );
    const buffer =
      formato === 'pdf'
        ? await generarPdfReporte(modelo)
        : await generarExcelReporte(modelo);

    return {
      buffer,
      nombreArchivo: `${modelo.nombreArchivo}.${formato}`,
      contentType:
        formato === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private async construirExportacion(
    reporte: ReporteExportable,
    query: ExportarReporteQueryDto,
  ): Promise<ReporteExportacion> {
    const sello = this.selloArchivo();

    switch (reporte) {
      case 'balanza': {
        const data = await this.balanza(query);
        return {
          titulo: 'Balanza de comprobación',
          subtitulo: `Del ${data.desde} al ${data.hasta}`,
          nombreArchivo: `balanza-${sello}`,
          columnas: [
            { encabezado: 'Código', clave: 'codigo', ancho: 12 },
            { encabezado: 'Cuenta', clave: 'nombre', ancho: 34 },
            { encabezado: 'Tipo', clave: 'tipo', ancho: 12 },
            { encabezado: 'Naturaleza', clave: 'naturaleza', ancho: 12 },
            {
              encabezado: 'Debe',
              clave: 'debe',
              ancho: 14,
              formatoMoneda: true,
            },
            {
              encabezado: 'Haber',
              clave: 'haber',
              ancho: 14,
              formatoMoneda: true,
            },
            {
              encabezado: 'Saldo deudor',
              clave: 'saldoDeudor',
              ancho: 14,
              formatoMoneda: true,
            },
            {
              encabezado: 'Saldo acreedor',
              clave: 'saldoAcreedor',
              ancho: 14,
              formatoMoneda: true,
            },
          ],
          filas: data.cuentas.map((cuenta) => ({ ...cuenta })),
          resumen: [
            { etiqueta: 'Total debe', valor: data.totales.debe },
            { etiqueta: 'Total haber', valor: data.totales.haber },
            { etiqueta: 'Saldo deudor', valor: data.totales.saldoDeudor },
            { etiqueta: 'Saldo acreedor', valor: data.totales.saldoAcreedor },
          ],
        };
      }
      case 'estado-resultados': {
        const data = await this.estadoResultados(query);
        return {
          titulo: 'Estado de resultados',
          subtitulo: `Del ${data.desde} al ${data.hasta}`,
          nombreArchivo: `estado-resultados-${sello}`,
          columnas: [
            { encabezado: 'Código', clave: 'codigo', ancho: 12 },
            { encabezado: 'Cuenta', clave: 'nombre', ancho: 40 },
            { encabezado: 'Tipo', clave: 'tipo', ancho: 12 },
            {
              encabezado: 'Debe',
              clave: 'debe',
              ancho: 14,
              formatoMoneda: true,
            },
            {
              encabezado: 'Haber',
              clave: 'haber',
              ancho: 14,
              formatoMoneda: true,
            },
            {
              encabezado: 'Saldo',
              clave: 'saldo',
              ancho: 14,
              formatoMoneda: true,
            },
          ],
          filas: data.cuentas.map((cuenta) => ({ ...cuenta })),
          resumen: [
            { etiqueta: 'Ingresos', valor: data.ingresos },
            { etiqueta: 'Gastos', valor: data.gastos },
            { etiqueta: 'Utilidad', valor: data.utilidad },
          ],
        };
      }
      case 'balance-general': {
        const data = await this.balanceGeneral(query);
        const filas = [
          ...data.activo.cuentas.map((cuenta) => ({
            seccion: 'Activo',
            codigo: cuenta.codigo,
            nombre: cuenta.nombre,
            saldo: cuenta.saldo,
          })),
          ...data.pasivo.cuentas.map((cuenta) => ({
            seccion: 'Pasivo',
            codigo: cuenta.codigo,
            nombre: cuenta.nombre,
            saldo: cuenta.saldo,
          })),
          ...data.capital.cuentas.map((cuenta) => ({
            seccion: 'Capital',
            codigo: cuenta.codigo,
            nombre: cuenta.nombre,
            saldo: cuenta.saldo,
          })),
        ];
        return {
          titulo: 'Balance general',
          subtitulo: `Del ${data.desde} al ${data.hasta}`,
          nombreArchivo: `balance-general-${sello}`,
          columnas: [
            { encabezado: 'Sección', clave: 'seccion', ancho: 14 },
            { encabezado: 'Código', clave: 'codigo', ancho: 12 },
            { encabezado: 'Cuenta', clave: 'nombre', ancho: 44 },
            {
              encabezado: 'Saldo',
              clave: 'saldo',
              ancho: 16,
              formatoMoneda: true,
            },
          ],
          filas,
          resumen: [
            { etiqueta: 'Total activo', valor: data.totalActivo },
            {
              etiqueta: 'Total pasivo + capital',
              valor: data.totalPasivoCapital,
            },
            { etiqueta: 'Utilidad', valor: data.resultados.utilidad },
            { etiqueta: 'Cuadra', valor: data.cuadra ? 'Sí' : 'No' },
          ],
        };
      }
      case 'mayor': {
        if (!query.cuentaId) {
          throw new BadRequestException(
            'El parámetro cuentaId es obligatorio para exportar el mayor',
          );
        }
        const data = await this.mayor({
          ...query,
          cuentaId: query.cuentaId,
        });
        return {
          titulo: `Mayor de ${data.cuenta.codigo} ${data.cuenta.nombre}`,
          subtitulo: `Del ${data.desde} al ${data.hasta}`,
          nombreArchivo: `mayor-${data.cuenta.codigo}-${sello}`,
          columnas: [
            { encabezado: 'Fecha', clave: 'fecha', ancho: 12 },
            { encabezado: 'Póliza', clave: 'folio', ancho: 16 },
            { encabezado: 'Concepto', clave: 'concepto', ancho: 44 },
            { encabezado: 'Referencia', clave: 'referencia', ancho: 18 },
            {
              encabezado: 'Debe',
              clave: 'debe',
              ancho: 12,
              formatoMoneda: true,
            },
            {
              encabezado: 'Haber',
              clave: 'haber',
              ancho: 12,
              formatoMoneda: true,
            },
            {
              encabezado: 'Saldo',
              clave: 'saldo',
              ancho: 12,
              formatoMoneda: true,
            },
          ],
          filas: data.movimientos,
          resumen: [
            { etiqueta: 'Saldo inicial', valor: data.saldoInicial },
            { etiqueta: 'Total debe', valor: data.totales.debe },
            { etiqueta: 'Total haber', valor: data.totales.haber },
            { etiqueta: 'Saldo final', valor: data.totales.saldoFinal },
          ],
        };
      }
      case 'auxiliar-clientes': {
        const data = await this.auxiliarClientes(query);
        if (query.clienteId && 'movimientos' in data) {
          return {
            titulo: `Auxiliar de ${data.cliente.nombre}`,
            subtitulo: `Del ${data.desde} al ${data.hasta}`,
            nombreArchivo: `auxiliar-cliente-${data.cliente.codigo}-${sello}`,
            columnas: [
              { encabezado: 'Fecha', clave: 'fecha', ancho: 12 },
              { encabezado: 'Tipo', clave: 'tipo', ancho: 10 },
              { encabezado: 'Folio', clave: 'folio', ancho: 18 },
              { encabezado: 'Concepto', clave: 'concepto', ancho: 46 },
              {
                encabezado: 'Monto',
                clave: 'monto',
                ancho: 14,
                formatoMoneda: true,
              },
              {
                encabezado: 'Saldo',
                clave: 'saldo',
                ancho: 14,
                formatoMoneda: true,
              },
            ],
            filas: data.movimientos,
            resumen: [
              { etiqueta: 'Saldo inicial', valor: data.saldoInicial },
              { etiqueta: 'Total cargos', valor: data.totales.cargos },
              { etiqueta: 'Total abonos', valor: data.totales.abonos },
              { etiqueta: 'Saldo final', valor: data.totales.saldoFinal },
            ],
          };
        }
        const resumen = data as {
          desde: string;
          hasta: string;
          clientes: Array<{
            codigo: string;
            nombre: string;
            cargos: number;
            abonos: number;
            saldo: number;
          }>;
          totales: { cargos: number; abonos: number; saldo: number };
        };
        return {
          titulo: 'Auxiliar de clientes',
          subtitulo: `Del ${resumen.desde} al ${resumen.hasta}`,
          nombreArchivo: `auxiliar-clientes-${sello}`,
          columnas: [
            { encabezado: 'Código', clave: 'codigo', ancho: 14 },
            { encabezado: 'Cliente', clave: 'nombre', ancho: 46 },
            {
              encabezado: 'Cargos',
              clave: 'cargos',
              ancho: 14,
              formatoMoneda: true,
            },
            {
              encabezado: 'Abonos',
              clave: 'abonos',
              ancho: 14,
              formatoMoneda: true,
            },
            {
              encabezado: 'Saldo',
              clave: 'saldo',
              ancho: 14,
              formatoMoneda: true,
            },
          ],
          filas: resumen.clientes,
          resumen: [
            { etiqueta: 'Total cargos', valor: resumen.totales.cargos },
            { etiqueta: 'Total abonos', valor: resumen.totales.abonos },
            { etiqueta: 'Saldo final', valor: resumen.totales.saldo },
          ],
        };
      }
      case 'auxiliar-proveedores': {
        const data = await this.auxiliarProveedores(query);
        if (query.proveedorId && 'movimientos' in data) {
          return {
            titulo: `Auxiliar de ${data.proveedor.nombre}`,
            subtitulo: `Del ${data.desde} al ${data.hasta}`,
            nombreArchivo: `auxiliar-proveedor-${data.proveedor.codigo}-${sello}`,
            columnas: [
              { encabezado: 'Fecha', clave: 'fecha', ancho: 12 },
              { encabezado: 'Tipo', clave: 'tipo', ancho: 10 },
              { encabezado: 'Folio', clave: 'folio', ancho: 18 },
              { encabezado: 'Concepto', clave: 'concepto', ancho: 46 },
              {
                encabezado: 'Monto',
                clave: 'monto',
                ancho: 14,
                formatoMoneda: true,
              },
              {
                encabezado: 'Saldo',
                clave: 'saldo',
                ancho: 14,
                formatoMoneda: true,
              },
            ],
            filas: data.movimientos,
            resumen: [
              { etiqueta: 'Saldo inicial', valor: data.saldoInicial },
              { etiqueta: 'Total cargos', valor: data.totales.cargos },
              { etiqueta: 'Total abonos', valor: data.totales.abonos },
              { etiqueta: 'Saldo final', valor: data.totales.saldoFinal },
            ],
          };
        }
        const resumen = data as {
          desde: string;
          hasta: string;
          proveedores: Array<{
            codigo: string;
            nombre: string;
            cargos: number;
            abonos: number;
            saldo: number;
          }>;
          totales: { cargos: number; abonos: number; saldo: number };
        };
        return {
          titulo: 'Auxiliar de proveedores',
          subtitulo: `Del ${resumen.desde} al ${resumen.hasta}`,
          nombreArchivo: `auxiliar-proveedores-${sello}`,
          columnas: [
            { encabezado: 'Código', clave: 'codigo', ancho: 14 },
            { encabezado: 'Proveedor', clave: 'nombre', ancho: 46 },
            {
              encabezado: 'Cargos',
              clave: 'cargos',
              ancho: 14,
              formatoMoneda: true,
            },
            {
              encabezado: 'Abonos',
              clave: 'abonos',
              ancho: 14,
              formatoMoneda: true,
            },
            {
              encabezado: 'Saldo',
              clave: 'saldo',
              ancho: 14,
              formatoMoneda: true,
            },
          ],
          filas: resumen.proveedores,
          resumen: [
            { etiqueta: 'Total cargos', valor: resumen.totales.cargos },
            { etiqueta: 'Total abonos', valor: resumen.totales.abonos },
            { etiqueta: 'Saldo final', valor: resumen.totales.saldo },
          ],
        };
      }
      case 'iva': {
        const data = await this.iva(query);
        return {
          titulo: 'IVA trasladado y acreditable',
          subtitulo: `Del ${data.desde} al ${data.hasta}`,
          nombreArchivo: `iva-${sello}`,
          columnas: [
            { encabezado: 'Fecha', clave: 'fecha', ancho: 12 },
            { encabezado: 'Póliza', clave: 'folio', ancho: 16 },
            { encabezado: 'Concepto', clave: 'concepto', ancho: 40 },
            { encabezado: 'Tipo', clave: 'tipo', ancho: 12 },
            { encabezado: 'Cuenta', clave: 'cuenta', ancho: 10 },
            {
              encabezado: 'Debe',
              clave: 'debe',
              ancho: 12,
              formatoMoneda: true,
            },
            {
              encabezado: 'Haber',
              clave: 'haber',
              ancho: 12,
              formatoMoneda: true,
            },
            {
              encabezado: 'Importe',
              clave: 'importe',
              ancho: 12,
              formatoMoneda: true,
            },
          ],
          filas: data.movimientos,
          resumen: [
            { etiqueta: 'IVA trasladado', valor: data.trasladado },
            { etiqueta: 'IVA acreditable', valor: data.acreditable },
            { etiqueta: 'IVA neto', valor: data.neto },
            { etiqueta: 'IVA por pagar', valor: data.porPagar },
            { etiqueta: 'Saldo a favor', valor: data.saldoFavor },
          ],
        };
      }
      case 'iva-mensual': {
        const data = await this.ivaMensual({ anio: query.anio });
        return {
          titulo: `IVA mensual ${data.anio}`,
          subtitulo: `Ejercicio fiscal ${data.anio}`,
          nombreArchivo: `iva-mensual-${data.anio}-${sello}`,
          columnas: [
            { encabezado: 'Mes', clave: 'mes', ancho: 12 },
            {
              encabezado: 'Trasladado',
              clave: 'trasladado',
              ancho: 14,
              formatoMoneda: true,
            },
            {
              encabezado: 'Acreditable',
              clave: 'acreditable',
              ancho: 14,
              formatoMoneda: true,
            },
            {
              encabezado: 'Neto',
              clave: 'neto',
              ancho: 14,
              formatoMoneda: true,
            },
            {
              encabezado: 'Por pagar',
              clave: 'porPagar',
              ancho: 14,
              formatoMoneda: true,
            },
            {
              encabezado: 'Saldo a favor',
              clave: 'saldoFavor',
              ancho: 14,
              formatoMoneda: true,
            },
          ],
          filas: data.meses,
          resumen: [
            { etiqueta: 'Total trasladado', valor: data.totales.trasladado },
            { etiqueta: 'Total acreditable', valor: data.totales.acreditable },
            { etiqueta: 'Total neto', valor: data.totales.neto },
            { etiqueta: 'Total por pagar', valor: data.totales.porPagar },
            { etiqueta: 'Total saldo a favor', valor: data.totales.saldoFavor },
          ],
        };
      }
    }
  }

  private selloArchivo() {
    const hoy = new Date();
    return `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`;
  }

  private async resolverRango(query: ReporteContableQueryDto) {
    if (query.periodoId) {
      const periodo = await this.periodosService.buscarPorId(query.periodoId);
      return {
        desde: this.fechaDb(periodo.fechaInicio),
        hasta: this.fechaDb(periodo.fechaFin),
      };
    }

    const hoy = new Date();
    const inicio = new Date(
      Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1),
    );
    const fin = new Date(
      Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 0),
    );
    const desde = query.desde ?? inicio.toISOString().slice(0, 10);
    const hasta = query.hasta ?? fin.toISOString().slice(0, 10);

    if (desde > hasta) {
      throw new BadRequestException(
        'El rango de fechas es inválido: "desde" debe ser anterior a "hasta"',
      );
    }
    return { desde, hasta };
  }

  private async obtenerSaldos(
    desde: string,
    hasta: string,
  ): Promise<SaldoCuenta[]> {
    const filas: FilaSaldo[] = await this.dataSource.query(
      `SELECT c.codigo, c.nombre, c.tipo, c.naturaleza,
              COALESCE(SUM(d.debe), 0) AS debe,
              COALESCE(SUM(d.haber), 0) AS haber
         FROM polizas_detalles d
         INNER JOIN polizas p ON p.id = d.poliza_id
         INNER JOIN cuentas_contables c ON c.id = d.cuenta_id
        WHERE p.estatus = 'contabilizada'
          AND p.fecha BETWEEN $1 AND $2
        GROUP BY c.id, c.codigo, c.nombre, c.tipo, c.naturaleza
        ORDER BY c.codigo ASC`,
      [desde, hasta],
    );

    return filas.map((fila) => {
      const debe = this.redondear2(Number(fila.debe) || 0);
      const haber = this.redondear2(Number(fila.haber) || 0);
      const saldo = this.redondear2(debe - haber);
      return {
        codigo: fila.codigo,
        nombre: fila.nombre,
        tipo: fila.tipo,
        naturaleza: fila.naturaleza,
        debe,
        haber,
        saldo,
        saldoDeudor: Math.max(saldo, 0),
        saldoAcreedor: Math.max(-saldo, 0),
      } satisfies SaldoCuenta;
    });
  }

  private seccion(cuentas: SaldoCuenta[], naturaleza: 'deudora' | 'acreedora') {
    const mapped = cuentas.map((cuenta) => {
      const saldo =
        naturaleza === 'deudora'
          ? this.redondear2(cuenta.debe - cuenta.haber)
          : this.redondear2(cuenta.haber - cuenta.debe);
      return {
        ...cuenta,
        saldo,
        saldoDeudor:
          naturaleza === 'deudora' ? Math.max(saldo, 0) : Math.max(-saldo, 0),
        saldoAcreedor:
          naturaleza === 'acreedora' ? Math.max(saldo, 0) : Math.max(-saldo, 0),
      };
    });

    return {
      cuentas: mapped,
      total: this.sumar(mapped),
    };
  }

  private sumar(cuentas: SaldoCuenta[]) {
    return this.redondear2(
      cuentas.reduce((total, cuenta) => total + Number(cuenta.saldo), 0),
    );
  }

  private fechaDb(fecha: Date | string) {
    if (typeof fecha === 'string') return fecha.slice(0, 10);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private redondear2(valor: number) {
    return Math.round(valor * 100) / 100;
  }
}
