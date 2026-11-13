import type { Repository } from 'typeorm';
import { CarteraResumenService } from './cartera-resumen.service';
import { CuentaPorCobrar } from './entities/cuenta-por-cobrar.entity';
import { CuentaPorPagar } from './entities/cuenta-por-pagar.entity';

describe('CarteraResumenService — aging', () => {
  const cxcRepository = { find: jest.fn() };
  const cxpRepository = { find: jest.fn() };

  let service: CarteraResumenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CarteraResumenService(
      cxcRepository as unknown as Repository<CuentaPorCobrar>,
      cxpRepository as unknown as Repository<CuentaPorPagar>,
    );
  });

  it('clasifica los saldos en los buckets de antigüedad', async () => {
    cxcRepository.find.mockResolvedValue([
      { saldo: '50.00', fechaVencimiento: '2026-12-01' },
      { saldo: '100.00', fechaVencimiento: '2026-11-05' },
      { saldo: '10.00', fechaVencimiento: '2026-10-01' },
      { saldo: '25.00', fechaVencimiento: '2026-08-20' },
      { saldo: '5.00', fechaVencimiento: '2026-07-01' },
    ]);
    cxpRepository.find.mockResolvedValue([
      { saldo: '200.00', fechaVencimiento: '2026-11-10' },
    ]);

    const resultado = await service.aging('2026-11-10');

    expect(resultado.fechaCorte).toBe('2026-11-10');
    expect(resultado.cxc.total).toBe(190);
    expect(resultado.cxc.buckets).toEqual([
      { rango: 'corriente', monto: 50, registros: 1 },
      { rango: '1-30', monto: 100, registros: 1 },
      { rango: '31-60', monto: 10, registros: 1 },
      { rango: '61-90', monto: 25, registros: 1 },
      { rango: '>90', monto: 5, registros: 1 },
    ]);
    expect(resultado.cxp.total).toBe(200);
    expect(resultado.cxp.buckets[0]).toEqual({
      rango: 'corriente',
      monto: 200,
      registros: 1,
    });
  });

  it('ignora saldos en cero', async () => {
    cxcRepository.find.mockResolvedValue([
      { saldo: '0.00', fechaVencimiento: '2026-10-01' },
    ]);
    cxpRepository.find.mockResolvedValue([]);

    const resultado = await service.aging('2026-11-10');

    expect(resultado.cxc.total).toBe(0);
    expect(
      resultado.cxc.buckets.every((bucket) => bucket.registros === 0),
    ).toBe(true);
  });
});
