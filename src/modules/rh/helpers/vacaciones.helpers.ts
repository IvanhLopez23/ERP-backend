import { BadRequestException } from '@nestjs/common';

export function validarFecha(fecha: string, campo: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new BadRequestException(`${campo} debe tener formato YYYY-MM-DD`);
  }
  const resultado = new Date(`${fecha}T00:00:00.000Z`);
  if (
    Number.isNaN(resultado.getTime()) ||
    resultado.toISOString().slice(0, 10) !== fecha
  ) {
    throw new BadRequestException(`${campo} no es una fecha válida`);
  }
  return resultado;
}

export function fechaUtc(fecha: Date | string): Date {
  const fechaTexto =
    typeof fecha === 'string'
      ? fecha.slice(0, 10)
      : fecha.toISOString().slice(0, 10);
  return new Date(`${fechaTexto}T00:00:00.000Z`);
}

export function agregarDias(fecha: Date, dias: number): Date {
  const resultado = fechaUtc(fecha);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

export function agregarAnios(fecha: Date, anios: number): Date {
  const original = fechaUtc(fecha);
  const dia = original.getUTCDate();
  const resultado = fechaUtc(fecha);
  resultado.setUTCDate(1);
  resultado.setUTCFullYear(resultado.getUTCFullYear() + anios);
  const ultimoDiaMes = new Date(
    Date.UTC(resultado.getUTCFullYear(), resultado.getUTCMonth() + 1, 0),
  ).getUTCDate();
  resultado.setUTCDate(Math.min(dia, ultimoDiaMes));
  return resultado;
}

export function agregarMeses(fecha: Date, meses: number): Date {
  const original = fechaUtc(fecha);
  const dia = original.getUTCDate();
  const resultado = fechaUtc(fecha);
  resultado.setUTCDate(1);
  resultado.setUTCMonth(resultado.getUTCMonth() + meses);
  const ultimoDiaMes = new Date(
    Date.UTC(resultado.getUTCFullYear(), resultado.getUTCMonth() + 1, 0),
  ).getUTCDate();
  resultado.setUTCDate(Math.min(dia, ultimoDiaMes));
  return resultado;
}

export function calcularAntiguedad(
  fechaIngreso: Date,
  fechaCorte: Date,
): number {
  const ingreso = fechaUtc(fechaIngreso);
  const corte = fechaUtc(fechaCorte);
  let anios = corte.getUTCFullYear() - ingreso.getUTCFullYear();
  const aniversario = agregarAnios(ingreso, anios);
  if (corte < aniversario) anios--;
  return Math.max(anios, 0);
}

export function contarDiasLaborables(
  fechaInicio: Date,
  fechaFin: Date,
): number {
  let dias = 0;
  let fecha = fechaUtc(fechaInicio);
  const fin = fechaUtc(fechaFin);
  while (fecha <= fin) {
    const diaSemana = fecha.getUTCDay();
    if (diaSemana !== 0 && diaSemana !== 6) dias++;
    fecha = agregarDias(fecha, 1);
  }
  return dias;
}
