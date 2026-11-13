import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CuentasService } from './cuentas.service';
import { PolizasService } from './polizas.service';
import { Poliza } from './entities/poliza.entity';
import { Venta } from '../ventas/entities/venta.entity';
import { Compra } from '../compras/entities/compra.entity';
import {
  cuentaCobroPorMetodo,
  cuentaPagoPorMetodo,
} from './contabilidad.constants';

interface DetalleContable {
  codigo: string;
  debe: number;
  haber: number;
  centroCostoId?: number | null;
}

interface ReembolsoCuenta {
  codigo: string;
  monto: number;
}

@Injectable()
export class IntegracionContableService {
  constructor(
    private readonly cuentasService: CuentasService,
    private readonly polizasService: PolizasService,
  ) {}

  async registrarVenta(
    venta: Venta,
    usuarioId: number,
    manager?: EntityManager,
    centroCostoId?: number | null,
  ) {
    const total = this.redondear2(Number(venta.total));
    const subtotal = this.redondear2(Number(venta.subtotal));
    const iva = this.redondear2(Number(venta.iva));
    const fecha = this.fechaString(venta.fechaVenta);

    return this.crearPolizaContabilizada(
      fecha,
      'ingreso',
      `Venta ${venta.folio}`,
      [
        { codigo: '1103', debe: total, haber: 0 },
        { codigo: '4101', debe: 0, haber: subtotal },
        { codigo: '2102', debe: 0, haber: iva },
      ],
      usuarioId,
      manager,
      centroCostoId,
    );
  }

  async registrarCompra(
    compra: Compra,
    usuarioId: number,
    manager?: EntityManager,
    centroCostoId?: number | null,
  ) {
    const total = this.redondear2(Number(compra.total));
    const subtotal = this.redondear2(Number(compra.subtotal));
    const iva = this.redondear2(Number(compra.iva));
    const fecha = this.fechaString(compra.fechaCompra);

    return this.crearPolizaContabilizada(
      fecha,
      'egreso',
      `Compra ${compra.folio}`,
      [
        { codigo: '1105', debe: subtotal, haber: 0 },
        { codigo: '1104', debe: iva, haber: 0 },
        { codigo: '2101', debe: 0, haber: total },
      ],
      usuarioId,
      manager,
      centroCostoId,
    );
  }

  async registrarCostoVenta(
    venta: Venta,
    usuarioId: number,
    manager?: EntityManager,
    centroCostoId?: number | null,
  ) {
    const costo = this.redondear2(
      (venta.detalles ?? []).reduce((total, detalle) => {
        const cantidad = Number(detalle.cantidad) || 0;
        const precioCosto = Number(detalle.producto?.precioCosto ?? 0) || 0;
        return total + cantidad * precioCosto;
      }, 0),
    );

    if (costo <= 0) return null;

    return this.crearPolizaContabilizada(
      this.fechaString(venta.fechaVenta),
      'diario',
      `Costo de venta ${venta.folio}`,
      [
        { codigo: '5101', debe: costo, haber: 0 },
        { codigo: '1105', debe: 0, haber: costo },
      ],
      usuarioId,
      manager,
      centroCostoId,
    );
  }

  async registrarCxcManual(
    folio: string,
    fecha: string,
    subtotal: number,
    iva: number,
    cuentaIngreso: string,
    concepto: string,
    usuarioId: number,
    manager?: EntityManager,
    centroCostoId?: number | null,
  ) {
    const importeSubtotal = this.redondear2(subtotal);
    const importeIva = this.redondear2(iva);
    const total = this.redondear2(importeSubtotal + importeIva);

    return this.crearPolizaContabilizada(
      fecha,
      'ingreso',
      `CxC manual ${folio}: ${concepto}`,
      [
        { codigo: '1103', debe: total, haber: 0 },
        { codigo: cuentaIngreso, debe: 0, haber: importeSubtotal },
        { codigo: '2102', debe: 0, haber: importeIva },
      ],
      usuarioId,
      manager,
      centroCostoId,
    );
  }

  async registrarCxpManual(
    folio: string,
    fecha: string,
    subtotal: number,
    iva: number,
    cuentaCargo: string,
    concepto: string,
    usuarioId: number,
    manager?: EntityManager,
    centroCostoId?: number | null,
  ) {
    const importeSubtotal = this.redondear2(subtotal);
    const importeIva = this.redondear2(iva);
    const total = this.redondear2(importeSubtotal + importeIva);

    return this.crearPolizaContabilizada(
      fecha,
      'egreso',
      `CxP manual ${folio}: ${concepto}`,
      [
        { codigo: cuentaCargo, debe: importeSubtotal, haber: 0 },
        { codigo: '1104', debe: importeIva, haber: 0 },
        { codigo: '2101', debe: 0, haber: total },
      ],
      usuarioId,
      manager,
      centroCostoId,
    );
  }

  async registrarDeclaracionIva(
    fecha: string,
    anio: number,
    mes: number,
    trasladado: number,
    acreditable: number,
    cuentaPago: string,
    usuarioId: number,
    manager?: EntityManager,
  ) {
    const importeTrasladado = this.redondear2(trasladado);
    const importeAcreditable = this.redondear2(acreditable);
    const compensado = this.redondear2(
      Math.min(importeTrasladado, importeAcreditable),
    );
    const detalles: DetalleContable[] = [];

    if (importeTrasladado > 0) {
      detalles.push({
        codigo: '2102',
        debe: importeTrasladado,
        haber: 0,
      });
    }
    if (compensado > 0) {
      detalles.push({ codigo: '1104', debe: 0, haber: compensado });
    }
    if (importeTrasladado > importeAcreditable) {
      detalles.push({
        codigo: cuentaPago,
        debe: 0,
        haber: this.redondear2(importeTrasladado - importeAcreditable),
      });
    }

    if (detalles.length < 2) return null;

    return this.crearPolizaContabilizada(
      fecha,
      'diario',
      `Declaración IVA ${anio}-${String(mes).padStart(2, '0')}`,
      detalles,
      usuarioId,
      manager,
    );
  }

  async registrarNomina(
    fecha: string,
    anio: number,
    mes: number,
    sueldosPorCentro: Array<{ centroCostoId: number | null; monto: number }>,
    totalIsr: number,
    totalImss: number,
    totalNeto: number,
    imssPatronal: number,
    provisionPrestaciones: number,
    usuarioId: number,
    manager?: EntityManager,
  ) {
    const detalles: DetalleContable[] = [];
    for (const sueldo of sueldosPorCentro) {
      const monto = this.redondear2(sueldo.monto);
      if (monto <= 0) continue;
      detalles.push({
        codigo: '5104',
        debe: monto,
        haber: 0,
        centroCostoId: sueldo.centroCostoId,
      });
    }

    const importePatronal = this.redondear2(imssPatronal);
    const importeProvision = this.redondear2(provisionPrestaciones);
    const importeIsr = this.redondear2(totalIsr);
    const importeImss = this.redondear2(totalImss);
    const importeNeto = this.redondear2(totalNeto);

    if (importePatronal > 0) {
      detalles.push({
        codigo: '5105',
        debe: importePatronal,
        haber: 0,
        centroCostoId: null,
      });
    }
    if (importeProvision > 0) {
      detalles.push({
        codigo: '5106',
        debe: importeProvision,
        haber: 0,
        centroCostoId: null,
      });
    }
    if (importeIsr > 0) {
      detalles.push({
        codigo: '2104',
        debe: 0,
        haber: importeIsr,
        centroCostoId: null,
      });
    }
    const imssPorPagar = this.redondear2(importeImss + importePatronal);
    if (imssPorPagar > 0) {
      detalles.push({
        codigo: '2105',
        debe: 0,
        haber: imssPorPagar,
        centroCostoId: null,
      });
    }
    if (importeProvision > 0) {
      detalles.push({
        codigo: '2106',
        debe: 0,
        haber: importeProvision,
        centroCostoId: null,
      });
    }
    if (importeNeto > 0) {
      detalles.push({
        codigo: '1102',
        debe: 0,
        haber: importeNeto,
        centroCostoId: null,
      });
    }

    return this.crearPolizaContabilizada(
      fecha,
      'diario',
      `Nómina ${anio}-${String(mes).padStart(2, '0')}`,
      detalles,
      usuarioId,
      manager,
      undefined,
      detalles.map((detalle) => detalle.centroCostoId ?? null),
    );
  }

  async registrarCobro(
    fecha: string,
    monto: number,
    metodoPago: string,
    usuarioId: number,
    manager?: EntityManager,
  ) {
    const importe = this.redondear2(monto);
    const cuenta = cuentaCobroPorMetodo(metodoPago);
    return this.crearPolizaContabilizada(
      fecha,
      'ingreso',
      `Cobro de cuenta por cobrar (${metodoPago})`,
      [
        { codigo: cuenta, debe: importe, haber: 0 },
        { codigo: '1103', debe: 0, haber: importe },
      ],
      usuarioId,
      manager,
    );
  }

  async registrarPago(
    fecha: string,
    monto: number,
    metodoPago: string,
    usuarioId: number,
    manager?: EntityManager,
  ) {
    const importe = this.redondear2(monto);
    const cuenta = cuentaPagoPorMetodo(metodoPago);
    return this.crearPolizaContabilizada(
      fecha,
      'egreso',
      `Pago de cuenta por pagar (${metodoPago})`,
      [
        { codigo: '2101', debe: importe, haber: 0 },
        { codigo: cuenta, debe: 0, haber: importe },
      ],
      usuarioId,
      manager,
    );
  }

  async cancelarPoliza(polizaId: number, manager?: EntityManager) {
    await this.polizasService.cancelarPorId(polizaId, manager);
  }

  /**
   * Nota de crédito por cancelación de venta.
   *
   * Revierte la venta completa: ingresos e IVA trasladado contra el saldo
   * pendiente de Clientes y el efectivo ya cobrado (que se reembolsa).
   */
  async registrarCancelacionVenta(
    folio: string,
    total: number,
    iva: number,
    saldo: number,
    reembolsos: ReembolsoCuenta[],
    usuarioId: number,
    manager?: EntityManager,
    cuentaIngreso = '4101',
    etiqueta = 'venta',
    centroCostoId?: number | null,
  ) {
    const importeTotal = this.redondear2(total);
    const importeIva = this.redondear2(iva);
    const importeSaldo = this.redondear2(saldo);
    const importeSubtotal = this.redondear2(importeTotal - importeIva);

    return this.crearPolizaContabilizada(
      this.fechaString(new Date()),
      'egreso',
      `Cancelación ${etiqueta} ${folio}`,
      [
        { codigo: cuentaIngreso, debe: importeSubtotal, haber: 0 },
        { codigo: '2102', debe: importeIva, haber: 0 },
        { codigo: '1103', debe: 0, haber: importeSaldo },
        ...reembolsos.map((reembolso) => ({
          codigo: reembolso.codigo,
          debe: 0,
          haber: this.redondear2(reembolso.monto),
        })),
      ],
      usuarioId,
      manager,
      centroCostoId,
    );
  }

  /**
   * Reverso por cancelación de compra.
   *
   * Revierte inventario e IVA acreditable contra el saldo pendiente de
   * Proveedores y las cuentas de donde salió el efectivo ya pagado.
   */
  async registrarCancelacionCompra(
    folio: string,
    total: number,
    iva: number,
    saldo: number,
    reembolsos: ReembolsoCuenta[],
    usuarioId: number,
    manager?: EntityManager,
    cuentaCargo = '1105',
    etiqueta = 'compra',
    centroCostoId?: number | null,
  ) {
    const importeTotal = this.redondear2(total);
    const importeIva = this.redondear2(iva);
    const importeSaldo = this.redondear2(saldo);
    const importeSubtotal = this.redondear2(importeTotal - importeIva);

    return this.crearPolizaContabilizada(
      this.fechaString(new Date()),
      'ingreso',
      `Cancelación ${etiqueta} ${folio}`,
      [
        { codigo: '2101', debe: importeSaldo, haber: 0 },
        ...reembolsos.map((reembolso) => ({
          codigo: reembolso.codigo,
          debe: this.redondear2(reembolso.monto),
          haber: 0,
        })),
        { codigo: cuentaCargo, debe: 0, haber: importeSubtotal },
        { codigo: '1104', debe: 0, haber: importeIva },
      ],
      usuarioId,
      manager,
      centroCostoId,
    );
  }

  private async crearPolizaContabilizada(
    fecha: string,
    tipo: string,
    concepto: string,
    detalles: DetalleContable[],
    usuarioId: number,
    manager?: EntityManager,
    centroCostoId?: number | null,
    centrosDetalleInternos?: Array<number | null>,
  ): Promise<Poliza> {
    const detallesResueltos: Array<{
      cuentaId: string;
      debe: number;
      haber: number;
    }> = [];
    for (const detalle of detalles) {
      if (detalle.debe === 0 && detalle.haber === 0) continue;
      const cuenta = await this.cuentasService.buscarPorCodigo(
        detalle.codigo,
        manager,
      );
      detallesResueltos.push({
        cuentaId: cuenta.publicId,
        debe: detalle.debe,
        haber: detalle.haber,
      });
    }

    if (detallesResueltos.length < 2) {
      throw new BadRequestException(
        'No hay cuentas contables suficientes para generar la póliza',
      );
    }

    const datosPoliza = {
      fecha,
      tipo,
      concepto,
      detalles: detallesResueltos,
    };

    let poliza: Poliza | null;
    if (centrosDetalleInternos !== undefined) {
      poliza = await this.polizasService.crear(
        datosPoliza,
        usuarioId,
        manager,
        centroCostoId,
        centrosDetalleInternos,
      );
    } else if (centroCostoId === undefined || centroCostoId === null) {
      poliza = await this.polizasService.crear(datosPoliza, usuarioId, manager);
    } else {
      poliza = await this.polizasService.crear(
        datosPoliza,
        usuarioId,
        manager,
        centroCostoId,
      );
    }

    if (!poliza) {
      throw new BadRequestException('No se pudo crear la póliza contable');
    }

    await this.polizasService.contabilizarPorId(poliza.id, manager);
    return poliza;
  }

  private fechaString(fecha: Date | string) {
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
