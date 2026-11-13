import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Equipo } from './equipo.entity';
import { OrdenTrabajo } from './orden-trabajo.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('planes_mantenimiento')
export class PlanMantenimiento extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  equipoId: number;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ length: 20 })
  tipo: string;

  @Column({ length: 20 })
  periodicidad: string;

  @Column({ type: 'int', default: 1 })
  intervalo: number;

  @Column({ type: 'date', nullable: true })
  fechaUltimoEjecucion: Date;

  @Column({ type: 'date', nullable: true })
  fechaProximaEjecucion: Date;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => Equipo, (equipo) => equipo.planes)
  @JoinColumn({ name: 'equipo_id' })
  equipo: Equipo;

  @OneToMany(() => OrdenTrabajo, (orden) => orden.planMantenimiento)
  ordenes: OrdenTrabajo[];
}
