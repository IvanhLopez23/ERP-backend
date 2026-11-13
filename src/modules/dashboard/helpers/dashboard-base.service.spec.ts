import { BadRequestException } from '@nestjs/common';
import { RangoDashboardDto } from '../dto';
import { DashboardBaseService } from './dashboard-base.service';

class TestDashboardService extends DashboardBaseService {
  resolver(query: RangoDashboardDto) {
    return this.resolverRango(query);
  }

  bucket(columna: string, agrupacion: string) {
    return this.bucketExpr(columna, agrupacion);
  }
}

describe('DashboardBaseService', () => {
  let service: TestDashboardService;

  beforeEach(() => {
    service = new TestDashboardService();
  });

  describe('resolverRango', () => {
    it('usa por defecto los últimos 12 meses agrupados por mes', () => {
      const r = service.resolver({});

      expect(r.agrupacion).toBe('mes');
      expect(r.buckets).toHaveLength(12);
      expect(r.buckets.at(-1)?.key).toBe(
        `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      );
    });

    it('respeta un rango explícito agrupado por mes', () => {
      const r = service.resolver({
        desde: '2026-01-15',
        hasta: '2026-03-10',
        agrupacion: 'mes',
      });

      expect(r.desde).toBe('2026-01-15');
      expect(r.hasta).toBe('2026-03-10');
      expect(r.buckets.map((b) => b.key)).toEqual([
        '2026-01',
        '2026-02',
        '2026-03',
      ]);
    });

    it('mantiene la agrupación por día cuando el rango no supera 62 días', () => {
      const r = service.resolver({
        desde: '2026-01-01',
        hasta: '2026-02-10',
        agrupacion: 'dia',
      });

      expect(r.agrupacion).toBe('dia');
      expect(r.buckets).toHaveLength(41);
    });

    it('cambia de día a semana cuando el rango supera 62 días', () => {
      const r = service.resolver({
        desde: '2026-01-01',
        hasta: '2026-12-31',
        agrupacion: 'dia',
      });

      expect(r.agrupacion).toBe('semana');
      expect(r.buckets.length).toBeGreaterThan(0);
    });

    it('lanza BadRequestException si "desde" es posterior a "hasta"', () => {
      expect(() =>
        service.resolver({ desde: '2026-05-10', hasta: '2026-05-01' }),
      ).toThrow(BadRequestException);
    });
  });

  describe('bucketExpr', () => {
    it('genera la expresión SQL según la agrupación', () => {
      expect(service.bucket('v.fecha_venta', 'mes')).toBe(
        "to_char(v.fecha_venta, 'YYYY-MM')",
      );
      expect(service.bucket('v.fecha_venta', 'semana')).toContain(
        "date_trunc('week'",
      );
      expect(service.bucket('v.fecha_venta', 'dia')).toBe(
        "to_char((v.fecha_venta)::date, 'YYYY-MM-DD')",
      );
    });
  });
});
