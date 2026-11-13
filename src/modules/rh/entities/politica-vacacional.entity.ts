import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('politicas_vacacionales')
@Unique(['aniosDesde', 'aniosHasta'])
export class PoliticaVacacional extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  aniosDesde: number;

  @Column({ type: 'int', nullable: true })
  aniosHasta: number | null;

  @Column({ type: 'int' })
  diasOtorgados: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;
}
