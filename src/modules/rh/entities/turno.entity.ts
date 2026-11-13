import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Empleado } from './empleado.entity';
import { Asistencia } from './asistencia.entity';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('turnos')
export class Turno extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  nombre: string;

  @Column({ length: 20 })
  periodicidad: string;

  @Column({ type: 'time', nullable: true })
  horaEntrada: string | null;

  @Column({ type: 'time', nullable: true })
  horaSalida: string | null;

  @Column({ type: 'time', nullable: true })
  horaComidaInicio: string | null;

  @Column({ type: 'time', nullable: true })
  horaComidaFin: string | null;

  @Column({ type: 'int', default: 10 })
  toleranciaMinutos: number;

  @Column({ length: 20, default: 'L,M,X,J,V' })
  diasLaborables: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @OneToMany(() => Empleado, (empleado) => empleado.turno)
  empleados: Empleado[];

  @OneToMany(() => Asistencia, (asistencia) => asistencia.turno)
  asistencias: Asistencia[];
}
