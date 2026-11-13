import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Equipo } from './equipo.entity';
import { PlanMantenimiento } from './plan-mantenimiento.entity';
import { DetalleOrdenTrabajo } from './detalle-orden-trabajo.entity';
import { Usuarios } from 'src/modules/usuarios/entities/index';
import { Empleado } from 'src/modules/rh/entities/empleado.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('ordenes_trabajo')
export class OrdenTrabajo extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  folio: string;

  @Column()
  equipoId: number;

  @Column({ nullable: true })
  planMantenimientoId: number;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'date' })
  fechaProgramada: Date;

  @Column({ type: 'date', nullable: true })
  fechaEjecucion: Date;

  @Column({ length: 20, default: 'pendiente' })
  estatus: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  costo: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column()
  solicitadoPor: number;

  @Column({ nullable: true })
  atendidoPor: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => Equipo, (equipo) => equipo.ordenes)
  @JoinColumn({ name: 'equipo_id' })
  equipo: Equipo;

  @ManyToOne(() => PlanMantenimiento, (plan) => plan.ordenes)
  @JoinColumn({ name: 'plan_mantenimiento_id' })
  planMantenimiento: PlanMantenimiento;

  @ManyToOne(() => Usuarios)
  @JoinColumn({ name: 'solicitado_por' })
  solicitante: Usuarios;

  @ManyToOne(() => Empleado)
  @JoinColumn({ name: 'atendido_por' })
  atendido: Empleado;

  @OneToMany(() => DetalleOrdenTrabajo, (detalle) => detalle.ordenTrabajo, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  detalles: DetalleOrdenTrabajo[];
}
