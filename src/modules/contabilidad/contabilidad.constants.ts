export const TIPOS_CUENTA = [
  'activo',
  'pasivo',
  'capital',
  'ingreso',
  'gasto',
] as const;

export type TipoCuenta = (typeof TIPOS_CUENTA)[number];

export const NATURALEZAS_CUENTA = ['deudora', 'acreedora'] as const;

export type NaturalezaCuenta = (typeof NATURALEZAS_CUENTA)[number];

export const TIPOS_POLIZA = ['ingreso', 'egreso', 'diario'] as const;

export type TipoPoliza = (typeof TIPOS_POLIZA)[number];

export const ESTATUS_POLIZA = [
  'borrador',
  'contabilizada',
  'cancelada',
] as const;

export type EstatusPoliza = (typeof ESTATUS_POLIZA)[number];

export const ESTATUS_PERIODO = ['abierto', 'cerrado'] as const;

export type EstatusPeriodo = (typeof ESTATUS_PERIODO)[number];

export const ESTATUS_CARTERA = [
  'pendiente',
  'parcial',
  'pagada',
  'cancelada',
] as const;

export type EstatusCartera = (typeof ESTATUS_CARTERA)[number];

export function naturalezaPorDefecto(tipo: TipoCuenta): NaturalezaCuenta {
  return tipo === 'activo' || tipo === 'gasto' ? 'deudora' : 'acreedora';
}

/** Cuentas contables usadas por los métodos de pago. */
export const CUENTA_CAJA = '1101';
export const CUENTA_BANCOS = '1102';
export const CUENTA_TARJETAS_POR_COBRAR = '1106';

export const CUENTAS_COBRO_POR_METODO: Record<string, string> = {
  efectivo: CUENTA_CAJA,
  transferencia: CUENTA_BANCOS,
  tarjeta: CUENTA_TARJETAS_POR_COBRAR,
  cheque: CUENTA_BANCOS,
  otro: CUENTA_CAJA,
};

export const CUENTAS_PAGO_POR_METODO: Record<string, string> = {
  efectivo: CUENTA_CAJA,
  transferencia: CUENTA_BANCOS,
  tarjeta: CUENTA_BANCOS,
  cheque: CUENTA_BANCOS,
  otro: CUENTA_CAJA,
};

export function cuentaCobroPorMetodo(metodoPago: string): string {
  return CUENTAS_COBRO_POR_METODO[metodoPago] ?? CUENTA_CAJA;
}

export function cuentaPagoPorMetodo(metodoPago: string): string {
  return CUENTAS_PAGO_POR_METODO[metodoPago] ?? CUENTA_BANCOS;
}
