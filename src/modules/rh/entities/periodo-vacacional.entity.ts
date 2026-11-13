import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Empleado } from './empleado.entity';
import { SolicitudPermiso } from './solicitud-permiso.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('periodos_vacacionales')
@Unique(['empleadoId', 'fechaInicio'])
export class PeriodoVacacional extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empleadoId: number;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date' })
  fechaFin: Date;

  @Column({ type: 'date' })
  fechaLimiteDisfrute: Date;

  @Column({ type: 'varchar', length: 150, nullable: true })
  descripcion: string | null;

  @Column({ type: 'int' })
  antiguedadAnios: number;

  @Column({ type: 'int' })
  diasOtorgados: number;

  @Column({ type: 'int', default: 0 })
  diasUsados: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => Empleado, (empleado) => empleado.periodosVacacionales)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @OneToMany(() => SolicitudPermiso, (solicitud) => solicitud.periodoVacacional)
  solicitudes: SolicitudPermiso[];
}
