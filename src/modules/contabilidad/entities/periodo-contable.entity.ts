import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('periodos_contables')
@Index(['anio', 'mes'], { unique: true })
export class PeriodoContable extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  anio: number;

  @Column()
  mes: number;

  @Column({ type: 'date' })
  fechaInicio: string;

  @Column({ type: 'date' })
  fechaFin: string;

  @Column({ length: 20, default: 'abierto' })
  estatus: string;

  @Column({ type: 'timestamp', nullable: true })
  fechaCierre: Date | null;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;
}
