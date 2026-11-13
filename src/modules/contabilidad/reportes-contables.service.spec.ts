import type { DataSource } from 'typeorm';
import { ReportesContablesService } from './reportes-contables.service';
import { CuentaContable } from './entities/cuenta-contable.entity';
import { CentroCosto } from './entities/centro-costo.entity';
import { PresupuestoCentroCosto } from './entities/presupuesto-centro-costo.entity';
import { Cliente } from '../ventas/entities/cliente.entity';
import { Proveedor } from '../compras/entities/proveedor.entity';
import type { PeriodosService } from './periodos.service';

describe('ReportesContablesService', () => {
  const cuentaRepository = { findOne: jest.fn() };
  const clienteRepository = { findOne: jest.fn() };
  const proveedorRepository = { findOne: jest.fn() };
  const centroRepository = { find: jest.fn(), findOne: jest.fn() };
  const presupuestoRepository = { find: jest.fn() };
  const dataSource = {
    query: jest.fn(),
    getRepository: jest.fn((entity) => {
      if (entity === CuentaContable) return cuentaRepository;
      if (entity === Cliente) return clienteRepository;
      if (entity === Proveedor) return proveedorRepository;
      if (entity === CentroCosto) return centroRepository;
      if (entity === PresupuestoCentroCosto) return presupuestoRepository;
      return {};
    }),
  };
  const periodosService = { buscarPorId: jest.fn() };

  let service: ReportesContablesService;

  beforeEach(() => {
    jest.clearAllMocks();
    centroRepository.find.mockResolvedValue([]);
    centroRepository.findOne.mockResolvedValue(null);
    presupuestoRepository.find.mockResolvedValue([]);
    service = new ReportesContablesService(
      dataSource as unknown as DataSource,
      periodosService as unknown as PeriodosService,
    );
  });

  it('calcula saldo inicial y saldo corrido de una cuenta deudora', async () => {
    cuentaRepository.findOne.mockResolvedValue({
      id: 1,
      publicId: 'cuenta-1',
      codigo: '1101',
      nombre: 'Caja',
      tipo: 'activo',
      naturaleza: 'deudora',
    });
    dataSource.query
      .mockResolvedValueOnce([{ debe: '100', haber: '20' }])
      .mockResolvedValueOnce([
        {
          fecha: '2026-11-02',
          folio: 'POL-202611-0001',
          public_id: 'poliza-1',
          concepto: 'Cobro',
          detalle_concepto: null,
          referencia: 'R1',
          debe: '50',
          haber: '0',
        },
        {
          fecha: '2026-11-03',
          folio: 'POL-202611-0002',
          public_id: 'poliza-2',
          concepto: 'Pago',
          detalle_concepto: 'Pago parcial',
          referencia: null,
          debe: '0',
          haber: '30',
        },
      ]);

    const resultado = await service.mayor({
      cuentaId: 'cuenta-1',
      desde: '2026-11-01',
      hasta: '2026-11-30',
    });

    expect(resultado.saldoInicial).toBe(80);
    expect(resultado.movimientos.map((mov) => mov.saldo)).toEqual([130, 100]);
    expect(resultado.movimientos[1].concepto).toBe('Pago parcial');
    expect(resultado.totales).toEqual({
      debe: 50,
      haber: 30,
      saldoFinal: 100,
    });
  });

  it('invierte el signo del saldo en cuentas acreedoras', async () => {
    cuentaRepository.findOne.mockResolvedValue({
      id: 2,
      publicId: 'cuenta-2',
      codigo: '2101',
      nombre: 'Proveedores',
      tipo: 'pasivo',
      naturaleza: 'acreedora',
    });
    dataSource.query
      .mockResolvedValueOnce([{ debe: '0', haber: '500' }])
      .mockResolvedValueOnce([
        {
          fecha: '2026-11-04',
          folio: 'POL-202611-0003',
          public_id: 'poliza-3',
          concepto: 'Pago a proveedor',
          detalle_concepto: null,
          referencia: null,
          debe: '100',
          haber: '0',
        },
      ]);

    const resultado = await service.mayor({
      cuentaId: 'cuenta-2',
      desde: '2026-11-01',
      hasta: '2026-11-30',
    });

    expect(resultado.saldoInicial).toBe(500);
    expect(resultado.movimientos[0].saldo).toBe(400);
    expect(resultado.totales.saldoFinal).toBe(400);
  });

  it('calcula IVA trasladado, acreditable y saldo a favor', async () => {
    dataSource.query.mockResolvedValueOnce([
      {
        fecha: '2026-11-10',
        folio: 'POL-202611-0001',
        public_id: 'poliza-1',
        concepto: 'Venta',
        codigo: '2102',
        debe: '0',
        haber: '160',
      },
      {
        fecha: '2026-11-11',
        folio: 'POL-202611-0002',
        public_id: 'poliza-2',
        concepto: 'Compra',
        codigo: '1104',
        debe: '80',
        haber: '0',
      },
      {
        fecha: '2026-11-12',
        folio: 'POL-202611-0003',
        public_id: 'poliza-3',
        concepto: 'Cancelación',
        codigo: '2102',
        debe: '160',
        haber: '0',
      },
    ]);

    const resultado = await service.iva({
      desde: '2026-11-01',
      hasta: '2026-11-30',
    });

    expect(resultado.trasladado).toBe(0);
    expect(resultado.acreditable).toBe(80);
    expect(resultado.neto).toBe(-80);
    expect(resultado.porPagar).toBe(0);
    expect(resultado.saldoFavor).toBe(80);
    expect(resultado.movimientos.map((mov) => mov.importe)).toEqual([
      160, 80, -160,
    ]);
  });

  it('genera el resumen mensual de IVA de los 12 meses', async () => {
    dataSource.query.mockResolvedValueOnce([
      { mes: '2026-01', trasladado: '1600', acreditable: '900' },
      { mes: '2026-11', trasladado: '160', acreditable: '80' },
    ]);

    const resultado = await service.ivaMensual({ anio: 2026 });

    expect(resultado.meses).toHaveLength(12);
    expect(resultado.meses[0]).toEqual({
      mes: '2026-01',
      trasladado: 1600,
      acreditable: 900,
      neto: 700,
      porPagar: 700,
      saldoFavor: 0,
    });
    expect(resultado.meses[1]).toEqual({
      mes: '2026-02',
      trasladado: 0,
      acreditable: 0,
      neto: 0,
      porPagar: 0,
      saldoFavor: 0,
    });
    expect(resultado.meses[10].neto).toBe(80);
    expect(resultado.totales).toEqual({
      trasladado: 1760,
      acreditable: 980,
      neto: 780,
      porPagar: 780,
      saldoFavor: 0,
    });
  });

  it('compara presupuesto contra real por centro de costo', async () => {
    presupuestoRepository.find.mockResolvedValue([
      {
        centroCostoId: 1,
        mes: 11,
        ingresosPresupuestados: '500',
        gastosPresupuestados: '300',
      },
    ]);
    centroRepository.find.mockResolvedValue([
      {
        id: 1,
        publicId: 'centro-1',
        codigo: 'CC-ADMIN',
        nombre: 'Administración',
        tipo: 'centro_costo',
      },
    ]);
    dataSource.query.mockResolvedValueOnce([
      {
        centro_id: 1,
        mes: 11,
        ingresos: '100',
        gastos: '50',
      },
    ]);

    const resultado = await service.presupuestoCentrosCosto({ anio: 2026 });

    expect(resultado.centros).toHaveLength(1);
    expect(resultado.centros[0].meses[10]).toEqual({
      mes: 11,
      presupuestoIngresos: 500,
      realIngresos: 100,
      variacionIngresos: -400,
      presupuestoGastos: 300,
      realGastos: 50,
      variacionGastos: -250,
      presupuestoUtilidad: 200,
      realUtilidad: 50,
      variacionUtilidad: -150,
    });
    expect(resultado.totales).toEqual({
      mes: 0,
      presupuestoIngresos: 500,
      realIngresos: 100,
      variacionIngresos: -400,
      presupuestoGastos: 300,
      realGastos: 50,
      variacionGastos: -250,
      presupuestoUtilidad: 200,
      realUtilidad: 50,
      variacionUtilidad: -150,
    });
  });
});
