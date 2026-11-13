import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

export type TipoFolio =
  | 'venta'
  | 'compra'
  | 'poliza'
  | 'cxc'
  | 'cxp'
  | 'salida';

interface OpcionesFolio {
  anio?: number;
  mes?: number;
}

interface FilaSecuencial {
  secuencial: string | number;
}

@Injectable()
export class FoliosService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Reserva el siguiente secuencial de forma atómica.
   *
   * Usa un UPSERT sobre `secuencias_folio`: la fila queda bloqueada hasta que
   * la transacción termina, por lo que dos peticiones concurrentes no pueden
   * obtener el mismo número. Si se pasa un `EntityManager`, participa en esa
   * transacción (y el incremento se revierte si la operación falla).
   */
  async siguiente(
    tipo: TipoFolio,
    opciones: OpcionesFolio = {},
    manager?: EntityManager,
  ): Promise<number> {
    const ejecutor = manager ?? this.dataSource.manager;
    const filas = await ejecutor.query<FilaSecuencial[]>(
      `INSERT INTO "secuencias_folio" ("tipo", "anio", "mes", "secuencial")
       VALUES ($1, $2, $3, 1)
       ON CONFLICT ("tipo", "anio", "mes")
       DO UPDATE SET "secuencial" = "secuencias_folio"."secuencial" + 1
       RETURNING "secuencial"`,
      [tipo, opciones.anio ?? 0, opciones.mes ?? 0],
    );

    const secuencial = Number(filas[0]?.secuencial);
    if (!Number.isInteger(secuencial) || secuencial <= 0) {
      throw new BadRequestException(`No se pudo generar el folio de ${tipo}`);
    }
    return secuencial;
  }
}
