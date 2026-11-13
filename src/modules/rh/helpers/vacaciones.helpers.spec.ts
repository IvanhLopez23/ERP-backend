import { BadRequestException } from '@nestjs/common';
import {
  agregarAnios,
  agregarMeses,
  calcularAntiguedad,
  contarDiasLaborables,
  fechaUtc,
  validarFecha,
} from './vacaciones.helpers';

describe('vacaciones.helpers', () => {
  describe('validarFecha', () => {
    it('parsea una fecha válida en UTC', () => {
      expect(validarFecha('2026-03-15', 'fecha')).toEqual(
        new Date('2026-03-15T00:00:00.000Z'),
      );
    });

    it('rechaza un formato distinto a YYYY-MM-DD', () => {
      expect(() => validarFecha('15-03-2026', 'fecha')).toThrow(
        BadRequestException,
      );
    });

    it('rechaza una fecha inexistente', () => {
      expect(() => validarFecha('2026-02-30', 'fecha')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('calcularAntiguedad', () => {
    it('solo cuenta años cumplidos', () => {
      expect(
        calcularAntiguedad(fechaUtc('2020-05-10'), fechaUtc('2024-05-09')),
      ).toBe(3);
      expect(
        calcularAntiguedad(fechaUtc('2020-05-10'), fechaUtc('2024-05-10')),
      ).toBe(4);
    });

    it('nunca devuelve valores negativos', () => {
      expect(
        calcularAntiguedad(fechaUtc('2025-01-01'), fechaUtc('2024-01-01')),
      ).toBe(0);
    });
  });

  describe('contarDiasLaborables', () => {
    it('excluye sábado y domingo', () => {
      // 2026-03-02 es lunes y 2026-03-08 es domingo.
      expect(
        contarDiasLaborables(fechaUtc('2026-03-02'), fechaUtc('2026-03-08')),
      ).toBe(5);
    });
  });

  describe('agregarAnios', () => {
    it('ajusta el 29 de febrero a fin de mes', () => {
      expect(agregarAnios(fechaUtc('2024-02-29'), 1)).toEqual(
        fechaUtc('2025-02-28'),
      );
    });
  });

  describe('agregarMeses', () => {
    it('ajusta el último día del mes destino', () => {
      expect(agregarMeses(fechaUtc('2026-01-31'), 1)).toEqual(
        fechaUtc('2026-02-28'),
      );
    });
  });
});
