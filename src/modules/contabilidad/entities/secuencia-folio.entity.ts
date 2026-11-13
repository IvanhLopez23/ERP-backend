import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Contador atómico de folios por tipo de documento.
 * `anio` y `mes` en 0 representan una secuencia global (ventas/compras).
 */
@Entity('secuencias_folio')
@Index(['tipo', 'anio', 'mes'], { unique: true })
export class SecuenciaFolio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  tipo: string;

  @Column({ default: 0 })
  anio: number;

  @Column({ default: 0 })
  mes: number;

  @Column({ default: 0 })
  secuencial: number;
}
