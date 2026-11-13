import { IntegracionContableService } from './integracion-contable.service';
import type { CuentasService } from './cuentas.service';
import type { PolizasService } from './polizas.service';
import type { Venta } from '../ventas/entities/venta.entity';

describe('IntegracionContableService — costo de venta', () => {
  const cuentasService = { buscarPorCodigo: jest.fn() };
  const polizasService = {
    crear: jest.fn(),
    contabilizarPorId: jest.fn(),
  };

  let service: IntegracionContableService;

  beforeEach(() => {
    jest.clearAllMocks();
    cuentasService.buscarPorCodigo.mockImplementation((codigo: string) => ({
      publicId: `cuenta-${codigo}`,
    }));
    polizasService.crear.mockResolvedValue({
      id: 1,
      publicId: 'poliza-1',
    });
    polizasService.contabilizarPorId.mockResolvedValue({
      msg: 'Póliza contabilizada exitosamente',
    });

    service = new IntegracionContableService(
      cuentasService as unknown as CuentasService,
      polizasService as unknown as PolizasService,
    );
  });

  it('genera la póliza Costo de ventas / Inventario', async () => {
    const venta = {
      folio: 'VT-20261110-0009',
      fechaVenta: '2026-11-10',
      detalles: [
        { cantidad: 2, producto: { precioCosto: 10 } },
        { cantidad: 1, producto: { precioCosto: 5 } },
      ],
    } as unknown as Venta;

    const resultado = await service.registrarCostoVenta(venta, 1);

    expect(resultado).toEqual({ id: 1, publicId: 'poliza-1' });
    expect(cuentasService.buscarPorCodigo).toHaveBeenCalledWith(
      '5101',
      undefined,
    );
    expect(cuentasService.buscarPorCodigo).toHaveBeenCalledWith(
      '1105',
      undefined,
    );
    expect(polizasService.crear).toHaveBeenCalledWith(
      {
        fecha: '2026-11-10',
        tipo: 'diario',
        concepto: 'Costo de venta VT-20261110-0009',
        detalles: [
          { cuentaId: 'cuenta-5101', debe: 25, haber: 0 },
          { cuentaId: 'cuenta-1105', debe: 0, haber: 25 },
        ],
      },
      1,
      undefined,
    );
    expect(polizasService.contabilizarPorId).toHaveBeenCalledWith(1, undefined);
  });

  it('no genera póliza si el costo es cero', async () => {
    const venta = {
      folio: 'VT-20261110-0010',
      fechaVenta: '2026-11-10',
      detalles: [{ cantidad: 1, producto: { precioCosto: 0 } }],
    } as unknown as Venta;

    const resultado = await service.registrarCostoVenta(venta, 1);

    expect(resultado).toBeNull();
    expect(polizasService.crear).not.toHaveBeenCalled();
  });

  it('genera la nota de crédito al cancelar una venta con cobros', async () => {
    await service.registrarCancelacionVenta(
      'VT-20261110-0001',
      232,
      32,
      32,
      [{ codigo: '1101', monto: 200 }],
      1,
    );

    expect(polizasService.crear).toHaveBeenCalledWith(
      {
        fecha: expect.any(String),
        tipo: 'egreso',
        concepto: 'Cancelación venta VT-20261110-0001',
        detalles: [
          { cuentaId: 'cuenta-4101', debe: 200, haber: 0 },
          { cuentaId: 'cuenta-2102', debe: 32, haber: 0 },
          { cuentaId: 'cuenta-1103', debe: 0, haber: 32 },
          { cuentaId: 'cuenta-1101', debe: 0, haber: 200 },
        ],
      },
      1,
      undefined,
    );
    expect(polizasService.contabilizarPorId).toHaveBeenCalledWith(1, undefined);
  });

  it('genera el reverso al cancelar una compra con pagos', async () => {
    await service.registrarCancelacionCompra(
      'CMP-20261110-0001',
      116,
      16,
      66,
      [{ codigo: '1102', monto: 50 }],
      1,
    );

    expect(polizasService.crear).toHaveBeenCalledWith(
      {
        fecha: expect.any(String),
        tipo: 'ingreso',
        concepto: 'Cancelación compra CMP-20261110-0001',
        detalles: [
          { cuentaId: 'cuenta-2101', debe: 66, haber: 0 },
          { cuentaId: 'cuenta-1102', debe: 50, haber: 0 },
          { cuentaId: 'cuenta-1105', debe: 0, haber: 100 },
          { cuentaId: 'cuenta-1104', debe: 0, haber: 16 },
        ],
      },
      1,
      undefined,
    );
  });

  it('usa Caja para cobros en efectivo', async () => {
    await service.registrarCobro('2026-11-10', 100, 'efectivo', 1);

    expect(cuentasService.buscarPorCodigo).toHaveBeenCalledWith(
      '1101',
      undefined,
    );
    expect(polizasService.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        concepto: 'Cobro de cuenta por cobrar (efectivo)',
        detalles: [
          { cuentaId: 'cuenta-1101', debe: 100, haber: 0 },
          { cuentaId: 'cuenta-1103', debe: 0, haber: 100 },
        ],
      }),
      1,
      undefined,
    );
  });

  it('usa Tarjetas por cobrar para cobros con tarjeta', async () => {
    await service.registrarCobro('2026-11-10', 100, 'tarjeta', 1);

    expect(cuentasService.buscarPorCodigo).toHaveBeenCalledWith(
      '1106',
      undefined,
    );
    expect(polizasService.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        concepto: 'Cobro de cuenta por cobrar (tarjeta)',
        detalles: [
          { cuentaId: 'cuenta-1106', debe: 100, haber: 0 },
          { cuentaId: 'cuenta-1103', debe: 0, haber: 100 },
        ],
      }),
      1,
      undefined,
    );
  });

  it('usa Bancos para pagos por transferencia', async () => {
    await service.registrarPago('2026-11-10', 100, 'transferencia', 1);

    expect(cuentasService.buscarPorCodigo).toHaveBeenCalledWith(
      '1102',
      undefined,
    );
    expect(polizasService.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        concepto: 'Pago de cuenta por pagar (transferencia)',
        detalles: [
          { cuentaId: 'cuenta-2101', debe: 100, haber: 0 },
          { cuentaId: 'cuenta-1102', debe: 0, haber: 100 },
        ],
      }),
      1,
      undefined,
    );
  });

  it('usa Caja para pagos en efectivo', async () => {
    await service.registrarPago('2026-11-10', 100, 'efectivo', 1);

    expect(cuentasService.buscarPorCodigo).toHaveBeenCalledWith(
      '1101',
      undefined,
    );
    expect(polizasService.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        concepto: 'Pago de cuenta por pagar (efectivo)',
        detalles: [
          { cuentaId: 'cuenta-2101', debe: 100, haber: 0 },
          { cuentaId: 'cuenta-1101', debe: 0, haber: 100 },
        ],
      }),
      1,
      undefined,
    );
  });

  it('genera la póliza de una CxC manual', async () => {
    await service.registrarCxcManual(
      'CXC-MAN-20261110-0001',
      '2026-11-10',
      100,
      16,
      '4102',
      'Servicio de consultoría',
      1,
    );

    expect(polizasService.crear).toHaveBeenCalledWith(
      {
        fecha: '2026-11-10',
        tipo: 'ingreso',
        concepto: 'CxC manual CXC-MAN-20261110-0001: Servicio de consultoría',
        detalles: [
          { cuentaId: 'cuenta-1103', debe: 116, haber: 0 },
          { cuentaId: 'cuenta-4102', debe: 0, haber: 100 },
          { cuentaId: 'cuenta-2102', debe: 0, haber: 16 },
        ],
      },
      1,
      undefined,
    );
  });

  it('genera la póliza de una CxP manual', async () => {
    await service.registrarCxpManual(
      'CXP-MAN-20261110-0001',
      '2026-11-10',
      200,
      32,
      '5102',
      'Renta de oficina',
      1,
    );

    expect(polizasService.crear).toHaveBeenCalledWith(
      {
        fecha: '2026-11-10',
        tipo: 'egreso',
        concepto: 'CxP manual CXP-MAN-20261110-0001: Renta de oficina',
        detalles: [
          { cuentaId: 'cuenta-5102', debe: 200, haber: 0 },
          { cuentaId: 'cuenta-1104', debe: 32, haber: 0 },
          { cuentaId: 'cuenta-2101', debe: 0, haber: 232 },
        ],
      },
      1,
      undefined,
    );
  });

  it('genera la póliza de declaración de IVA con pago', async () => {
    await service.registrarDeclaracionIva(
      '2026-11-10',
      2026,
      10,
      160,
      80,
      '1102',
      1,
    );

    expect(polizasService.crear).toHaveBeenCalledWith(
      {
        fecha: '2026-11-10',
        tipo: 'diario',
        concepto: 'Declaración IVA 2026-10',
        detalles: [
          { cuentaId: 'cuenta-2102', debe: 160, haber: 0 },
          { cuentaId: 'cuenta-1104', debe: 0, haber: 80 },
          { cuentaId: 'cuenta-1102', debe: 0, haber: 80 },
        ],
      },
      1,
      undefined,
    );
  });

  it('compensa IVA a favor sin generar pago', async () => {
    await service.registrarDeclaracionIva(
      '2026-11-10',
      2026,
      1,
      2.4,
      16,
      '1102',
      1,
    );

    expect(polizasService.crear).toHaveBeenCalledWith(
      {
        fecha: '2026-11-10',
        tipo: 'diario',
        concepto: 'Declaración IVA 2026-01',
        detalles: [
          { cuentaId: 'cuenta-2102', debe: 2.4, haber: 0 },
          { cuentaId: 'cuenta-1104', debe: 0, haber: 2.4 },
        ],
      },
      1,
      undefined,
    );
  });

  it('no genera póliza si no hay IVA trasladado', async () => {
    const resultado = await service.registrarDeclaracionIva(
      '2026-11-10',
      2026,
      1,
      0,
      50,
      '1102',
      1,
    );

    expect(resultado).toBeNull();
    expect(polizasService.crear).not.toHaveBeenCalled();
  });

  it('genera la póliza de nómina con sueldos por centro de costo', async () => {
    await service.registrarNomina(
      '2026-11-30',
      2026,
      11,
      [
        { centroCostoId: 1, monto: 10000 },
        { centroCostoId: null, monto: 5000 },
      ],
      1500,
      500,
      13000,
      1200,
      800,
      1,
    );

    expect(polizasService.crear).toHaveBeenCalledWith(
      {
        fecha: '2026-11-30',
        tipo: 'diario',
        concepto: 'Nómina 2026-11',
        detalles: [
          { cuentaId: 'cuenta-5104', debe: 10000, haber: 0 },
          { cuentaId: 'cuenta-5104', debe: 5000, haber: 0 },
          { cuentaId: 'cuenta-5105', debe: 1200, haber: 0 },
          { cuentaId: 'cuenta-5106', debe: 800, haber: 0 },
          { cuentaId: 'cuenta-2104', debe: 0, haber: 1500 },
          { cuentaId: 'cuenta-2105', debe: 0, haber: 1700 },
          { cuentaId: 'cuenta-2106', debe: 0, haber: 800 },
          { cuentaId: 'cuenta-1102', debe: 0, haber: 13000 },
        ],
      },
      1,
      undefined,
      undefined,
      [1, null, null, null, null, null, null, null],
    );
  });

  it('la póliza de nómina queda balanceada', async () => {
    await service.registrarNomina(
      '2026-11-30',
      2026,
      11,
      [{ centroCostoId: 1, monto: 10000 }],
      1000,
      200,
      8800,
      1200,
      800,
      1,
    );

    const datos = polizasService.crear.mock.calls[0][0] as {
      detalles: Array<{ debe: number; haber: number }>;
    };
    const debe = datos.detalles.reduce(
      (total, detalle) => total + detalle.debe,
      0,
    );
    const haber = datos.detalles.reduce(
      (total, detalle) => total + detalle.haber,
      0,
    );

    expect(debe).toBe(haber);
  });
});
