import { BadRequestException } from '@nestjs/common';
import {
  GraficaDto,
  KpiDto,
  RangoDashboardDto,
  SerieDto,
  TipoGrafica,
} from '../dto';

export interface Bucket {
  key: string;
  label: string;
}

export interface RangoResuelto {
  desde: string;
  hasta: string;
  agrupacion: 'dia' | 'semana' | 'mes';
  buckets: Bucket[];
}

const MESES_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

const pad2 = (n: number): string => String(n).padStart(2, '0');

export const redondear2 = (n: unknown): number =>
  Math.round(Number(n ?? 0) * 100) / 100;

export const redondear1 = (n: unknown): number =>
  Math.round(Number(n ?? 0) * 10) / 10;

export function parseDia(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function claveDia(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function sumarDias(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export abstract class DashboardBaseService {
  protected resolverRango(query: RangoDashboardDto): RangoResuelto {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hasta = query.hasta ? parseDia(query.hasta) : hoy;
    const desde = query.desde
      ? parseDia(query.desde)
      : new Date(hasta.getFullYear(), hasta.getMonth() - 11, 1);
    if (desde > hasta) {
      throw new BadRequestException(
        'El rango de fechas es inválido: "desde" debe ser anterior a "hasta"',
      );
    }
    let agrupacion = query.agrupacion ?? 'mes';
    const dias = Math.round((hasta.getTime() - desde.getTime()) / 86400000) + 1;
    if (agrupacion === 'dia' && dias > 62) agrupacion = 'semana';

    const buckets: Bucket[] = [];
    if (agrupacion === 'mes') {
      let d = new Date(desde.getFullYear(), desde.getMonth(), 1);
      const fin = new Date(hasta.getFullYear(), hasta.getMonth(), 1);
      while (d <= fin) {
        buckets.push({
          key: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`,
          label: `${MESES_ES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        });
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      }
    } else if (agrupacion === 'semana') {
      let d = new Date(desde);
      d = sumarDias(d, -((d.getDay() + 6) % 7));
      while (d <= hasta) {
        buckets.push({
          key: claveDia(d),
          label: `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`,
        });
        d = sumarDias(d, 7);
      }
    } else {
      let d = new Date(desde);
      while (d <= hasta) {
        buckets.push({
          key: claveDia(d),
          label: `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`,
        });
        d = sumarDias(d, 1);
      }
    }
    return {
      desde: claveDia(desde),
      hasta: claveDia(hasta),
      agrupacion,
      buckets,
    };
  }

  protected bucketExpr(columna: string, agrupacion: string): string {
    if (agrupacion === 'mes') return `to_char(${columna}, 'YYYY-MM')`;
    if (agrupacion === 'semana')
      return `to_char(date_trunc('week', ${columna})::date, 'YYYY-MM-DD')`;
    return `to_char((${columna})::date, 'YYYY-MM-DD')`;
  }

  protected serieEnBuckets(
    buckets: Bucket[],
    filas: Array<{ bucket: string; valor: unknown }>,
  ): number[] {
    const indice = new Map(buckets.map((b, i) => [b.key, i]));
    const datos = buckets.map(() => 0);
    for (const fila of filas) {
      const i = indice.get(fila.bucket);
      if (i !== undefined) datos[i] = Number(fila.valor) || 0;
    }
    return datos;
  }

  protected pivot(
    buckets: Bucket[],
    filas: Array<{ bucket: string; valor: unknown; [k: string]: unknown }>,
    categorias: string[],
    campo = 'estatus',
  ): SerieDto[] {
    const indice = new Map(buckets.map((b, i) => [b.key, i]));
    const series: SerieDto[] = categorias.map((nombre) => ({
      nombre,
      datos: buckets.map(() => 0),
    }));
    const sIndice = new Map(categorias.map((c, i) => [c, i]));
    for (const fila of filas) {
      const si = sIndice.get(String(fila[campo]));
      const bi = indice.get(fila.bucket);
      if (si !== undefined && bi !== undefined)
        series[si].datos[bi] = Number(fila.valor) || 0;
    }
    return series;
  }

  protected grafica(
    tipo: TipoGrafica,
    labels: string[],
    series: SerieDto[],
  ): GraficaDto {
    return { tipo, labels, series };
  }

  protected kpi(
    clave: string,
    etiqueta: string,
    valor: number | string,
    unidad?: string,
    variacion?: number,
  ): KpiDto {
    const k: KpiDto = { clave, etiqueta, valor };
    if (unidad !== undefined) k.unidad = unidad;
    if (variacion !== undefined) k.variacion = variacion;
    return k;
  }

  protected variacion(actual: unknown, previo: unknown): number | undefined {
    const a = Number(actual) || 0;
    const p = Number(previo) || 0;
    if (p === 0) return undefined;
    return redondear1(((a - p) / p) * 100);
  }

  protected mesActual(): { desde: string; hasta: string } {
    const hoy = new Date();
    return {
      desde: claveDia(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
      hasta: claveDia(hoy),
    };
  }

  protected mesPrevio(): { desde: string; hasta: string } {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    return { desde: claveDia(inicio), hasta: claveDia(fin) };
  }
}
