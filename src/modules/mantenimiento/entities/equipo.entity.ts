import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PlanMantenimiento } from './plan-mantenimiento.entity';
import { OrdenTrabajo } from './orden-trabajo.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('equipos')
export class Equipo extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ length: 255, nullable: true })
  ubicacion: string;

  @Column({ type: 'date', nullable: true })
  fechaAdquisicion: Date;

  @Column({ length: 30, default: 'operativo' })
  estado: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @OneToMany(() => PlanMantenimiento, (plan) => plan.equipo)
  planes: PlanMantenimiento[];

  @OneToMany(() => OrdenTrabajo, (orden) => orden.equipo)
  ordenes: OrdenTrabajo[];
}
