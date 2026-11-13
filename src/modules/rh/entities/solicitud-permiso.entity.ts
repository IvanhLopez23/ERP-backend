import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empleado } from './empleado.entity';
import { Usuarios } from 'src/modules/usuarios/entities/index';
import { PeriodoVacacional } from './periodo-vacacional.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('solicitudes_permiso')
export class SolicitudPermiso extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empleadoId: number;

  @Column({ length: 30 })
  tipo: string;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date' })
  fechaFin: Date;

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  comprobante: string | null;

  @Column({ length: 20, default: 'pendiente' })
  estatus: string;

  @Column({ type: 'int', nullable: true })
  diasSolicitados: number;

  @Column({ nullable: true })
  periodoVacacionalId: number;

  @Column({ nullable: true })
  aprobadoPor: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => Empleado, (empleado) => empleado.solicitudesPermiso)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @ManyToOne(() => Usuarios)
  @JoinColumn({ name: 'aprobado_por' })
  aprobador: Usuarios;

  @ManyToOne(() => PeriodoVacacional, (periodo) => periodo.solicitudes, {
    nullable: true,
  })
  @JoinColumn({ name: 'periodo_vacacional_id' })
  periodoVacacional: PeriodoVacacional;
}
