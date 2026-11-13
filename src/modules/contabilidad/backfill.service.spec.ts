import type { DataSource, Repository } from 'typeorm';
import { BackfillService } from './backfill.service';
import { Venta } from '../ventas/entities/venta.entity';
import { Compra } from '../compras/entities/compra.entity';
import { CuentaPorCobrar } from './entities/cuenta-por-cobrar.entity';
import { CuentaPorPagar } from './entities/cuenta-por-pagar.entity';
import { PeriodoContable } from './entities/periodo-contable.entity';
import type { CxcService } from './cxc.service';
import type { CxpService } from './cxp.service';
import type { PeriodosService } from './periodos.service';

describe('BackfillService', () => {
  const ventaRepository = { find: jest.fn() };
  const compraRepository = { find: jest.fn() };
  const cxcRepository = { find: jest.fn() };
  const cxpRepository = { find: jest.fn() };
  const periodoRepository = { findOne: jest.fn() };
  const dataSource = {
    getRepository: jest.fn((entity) => {
      if (entity === Venta) return ventaRepository;
      if (entity === Compra) return compraRepository;
      return {};
    }),
  };
  const cxcService = { crearDesdeVenta: jest.fn() };
  const cxpService = { crearDesdeCompra: jest.fn() };
  const periodosService = { crear: jest.fn() };

  let service: BackfillService;

  beforeEach(() => {
    jest.clearAllMocks();
    cxcService.crearDesdeVenta.mockResolvedValue({});
    cxpService.crearDesdeCompra.mockResolvedValue({});
    periodosService.crear.mockResolvedValue({});
    cxcRepository.find.mockResolvedValue([]);
    cxpRepository.find.mockResolvedValue([]);
    periodoRepository.findOne.mockResolvedValue({ id: 1 });
    ventaRepository.find.mockResolvedValue([]);
    compraRepository.find.mockResolvedValue([]);

    service = new BackfillService(
      dataSource as unknown as DataSource,
      cxcRepository as unknown as Repository<CuentaPorCobrar>,
      cxpRepository as unknown as Repository<CuentaPorPagar>,
      periodoRepository as unknown as Repository<PeriodoContable>,
      cxcService as unknown as CxcService,
      cxpService as unknown as CxpService,
      periodosService as unknown as PeriodosService,
    );
  });

  it('procesa solo ventas/compras sin CxC/CxP', async () => {
    ventaRepository.find.mockResolvedValue([
      { id: 1, usuarioId: 1, fechaVenta: '2026-01-31' },
      { id: 2, usuarioId: 1, fechaVenta: '2026-02-01' },
    ]);
    compraRepository.find.mockResolvedValue([
      { id: 10, usuarioId: 1, fechaCompra: '2026-02-01' },
    ]);
    cxcRepository.find.mockResolvedValue([{ ventaId: 1 }]);

    const resumen = await service.ejecutar({ crearPeriodos: true });

    expect(resumen.ventas).toEqual({
      procesadas: 1,
      omitidas: 1,
      errores: 0,
    });
    expect(resumen.compras).toEqual({
      procesadas: 1,
      omitidas: 0,
      errores: 0,
    });
    expect(cxcService.crearDesdeVenta).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2 }),
      1,
    );
    expect(cxpService.crearDesdeCompra).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10 }),
      1,
    );
  });

  it('crea el periodo faltante para la fecha de la venta', async () => {
    ventaRepository.find.mockResolvedValue([
      { id: 1, usuarioId: 1, fechaVenta: '2026-01-31' },
    ]);
    periodoRepository.findOne.mockResolvedValue(null);

    const resumen = await service.ejecutar({ crearPeriodos: true });

    expect(periodosService.crear).toHaveBeenCalledWith({
      anio: 2026,
      mes: 1,
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-31',
    });
    expect(resumen.periodosCreados).toBe(1);
    expect(resumen.ventas.procesadas).toBe(1);
  });
});
