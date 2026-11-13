export interface DetalleCalculable {
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
}

export interface TotalesDetalle<T extends DetalleCalculable> {
  procesados: Array<T & { descuento: number; subtotal: number }>;
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
}

export const IVA = 0.16;

/**
 * Calcula subtotal, descuento, IVA y total de una lista de detalles de
 * venta o cotización. Cada detalle se devuelve con su descuento
 * normalizado y su subtotal ya aplicado.
 */
export function calcularDetalles<T extends DetalleCalculable>(
  detalles: T[],
): TotalesDetalle<T> {
  let subtotal = 0;
  let descuentoTotal = 0;
  const procesados = detalles.map((d) => {
    const pct = d.descuento || 0;
    const subt = d.cantidad * d.precioUnitario;
    const desc = subt * (pct / 100);
    subtotal += subt - desc;
    descuentoTotal += desc;
    return { ...d, descuento: pct, subtotal: subt - desc };
  });
  const iva = subtotal * IVA;
  const total = subtotal + iva;
  return { procesados, subtotal, descuento: descuentoTotal, iva, total };
}
