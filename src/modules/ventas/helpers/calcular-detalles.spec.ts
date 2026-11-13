import { calcularDetalles } from './calcular-detalles';

describe('calcularDetalles', () => {
  it('calcula subtotal, IVA y total sin descuento', () => {
    const r = calcularDetalles([
      { productoId: 'p1', cantidad: 2, precioUnitario: 100 },
    ]);

    expect(r.subtotal).toBe(200);
    expect(r.descuento).toBe(0);
    expect(r.iva).toBe(32);
    expect(r.total).toBe(232);
  });

  it('aplica el descuento por línea y lo normaliza', () => {
    const r = calcularDetalles([
      { productoId: 'p1', cantidad: 2, precioUnitario: 100, descuento: 10 },
    ]);

    expect(r.procesados[0]).toMatchObject({ descuento: 10, subtotal: 180 });
    expect(r.subtotal).toBe(180);
    expect(r.descuento).toBe(20);
    expect(r.iva).toBe(28.8);
    expect(r.total).toBe(208.8);
  });

  it('acumula varias líneas y conserva los campos originales', () => {
    const r = calcularDetalles([
      { productoId: 'p1', cantidad: 1, precioUnitario: 50 },
      { productoId: 'p2', cantidad: 3, precioUnitario: 20, descuento: 5 },
    ]);

    expect(r.procesados).toHaveLength(2);
    expect(r.procesados[1]).toMatchObject({ productoId: 'p2', subtotal: 57 });
    expect(r.subtotal).toBe(107);
    expect(r.descuento).toBe(3);
    expect(r.iva).toBeCloseTo(17.12, 2);
    expect(r.total).toBeCloseTo(124.12, 2);
  });

  it('redondea el descuento omitido a 0', () => {
    const r = calcularDetalles([
      { cantidad: 1, precioUnitario: 10, descuento: undefined },
    ]);

    expect(r.procesados[0].descuento).toBe(0);
    expect(r.total).toBeCloseTo(11.6, 2);
  });
});
