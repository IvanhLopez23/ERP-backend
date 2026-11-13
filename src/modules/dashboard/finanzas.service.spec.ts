import type { DataSource } from 'typeorm';
import { DashboardFinanzasService } from './finanzas.service';

describe('DashboardFinanzasService', () => {
  const dataSource = { query: jest.fn() };

  let service: DashboardFinanzasService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardFinanzasService(dataSource as unknown as DataSource);
  });

  it('calcula los KPIs y las gráficas financieras', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ ingresos: '1000', gastos: '400' }])
      .mockResolvedValueOnce([{ ingresos: '800', gastos: '500' }])
      .mockResolvedValueOnce([{ cobrado: '600', pagado: '250' }])
      .mockResolvedValueOnce([{ flujo: '350' }])
      .mockResolvedValueOnce([{ pendiente: '500', vencida: '120' }])
      .mockResolvedValueOnce([{ pendiente: '300', vencida: '0' }])
      .mockResolvedValueOnce([
        { bucket: '2026-11', tipo: 'ingreso', valor: '1000' },
        { bucket: '2026-11', tipo: 'gasto', valor: '400' },
      ])
      .mockResolvedValueOnce([{ bucket: '2026-11', valor: '600' }])
      .mockResolvedValueOnce([{ bucket: '2026-11', valor: '250' }])
      .mockResolvedValueOnce([
        { rango: 'corriente', valor: '380' },
        { rango: '1-30', valor: '120' },
      ])
      .mockResolvedValueOnce([{ rango: 'corriente', valor: '300' }])
      .mockResolvedValueOnce([{ nombre: 'Cliente A', valor: '500' }])
      .mockResolvedValueOnce([{ nombre: '5102 Gastos', valor: '400' }]);

    const resultado = await service.obtenerDashboardFinanzas({
      desde: '2026-11-01',
      hasta: '2026-11-30',
      agrupacion: 'mes',
    });

    const kpi = (clave: string) =>
      resultado.kpis.find((item) => item.clave === clave);

    expect(kpi('ingresosPeriodo')?.valor).toBe(1000);
    expect(kpi('gastosPeriodo')?.valor).toBe(400);
    expect(kpi('utilidadPeriodo')?.valor).toBe(600);
    expect(kpi('margenUtilidad')?.valor).toBe(60);
    expect(kpi('cobradoPeriodo')?.valor).toBe(600);
    expect(kpi('pagadoPeriodo')?.valor).toBe(250);
    expect(kpi('flujoNeto')?.valor).toBe(350);
    expect(kpi('cxcPendiente')?.valor).toBe(500);
    expect(kpi('cxcVencida')?.valor).toBe(120);
    expect(kpi('cxpPendiente')?.valor).toBe(300);

    expect(kpi('ingresosPeriodo')?.variacion).toBe(25);
    expect(kpi('gastosPeriodo')?.variacion).toBe(-20);
    expect(kpi('utilidadPeriodo')?.variacion).toBe(100);

    expect(
      resultado.graficas.ingresosGastos.series.map((serie) => serie.datos),
    ).toEqual([[1000], [400], [600]]);
    expect(
      resultado.graficas.flujoEfectivo.series.map((serie) => serie.datos),
    ).toEqual([[600], [250]]);
    expect(resultado.graficas.carteraCxcAntiguedad.labels).toEqual([
      'corriente',
      '1-30',
      '31-60',
      '61-90',
      '>90',
    ]);
    expect(resultado.graficas.carteraCxcAntiguedad.series[0].datos).toEqual([
      380, 120, 0, 0, 0,
    ]);
    expect(resultado.graficas.topClientesCartera.labels).toEqual(['Cliente A']);
  });
});
