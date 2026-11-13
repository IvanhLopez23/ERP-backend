import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Departamento } from './departamento.entity';
import { Puesto } from './puesto.entity';
import { Usuarios } from 'src/modules/usuarios/entities/index';
import { Contrato } from './contrato.entity';
import { Asistencia } from './asistencia.entity';
import { SolicitudPermiso } from './solicitud-permiso.entity';
import { PeriodoVacacional } from './periodo-vacacional.entity';
import { Turno } from './turno.entity';
import { CentroCosto } from '../../contabilidad/entities/centro-costo.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('empleados')
export class Empleado extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ nullable: true })
  usuarioId: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellidoPaterno: string;

  @Column({ length: 100, nullable: true })
  apellidoMaterno: string;

  @Column({ length: 10, nullable: true })
  genero: string;

  @Column({ type: 'date', nullable: true })
  fechaNacimiento: Date;

  @Column({ length: 20, nullable: true })
  rfc: string;

  @Column({ length: 20, nullable: true })
  curp: string;

  @Column({ length: 20, nullable: true })
  nss: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 100, nullable: true })
  correo: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ length: 255, nullable: true })
  foto: string;

  @Column()
  departamentoId: number;

  @Column()
  puestoId: number;

  @Column({ nullable: true })
  turnoId: number;

  @Column({ nullable: true })
  jefeId: number;

  @Column({ type: 'date' })
  fechaIngreso: Date;

  @Column({ type: 'date', nullable: true })
  fechaSalida: Date;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  salario: number;

  @Column({ type: 'int', nullable: true })
  centroCostoId: number | null;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => Departamento, (departamento) => departamento.empleados)
  @JoinColumn({ name: 'departamento_id' })
  departamento: Departamento;

  @ManyToOne(() => Puesto, (puesto) => puesto.empleados)
  @JoinColumn({ name: 'puesto_id' })
  puesto: Puesto;

  @ManyToOne(() => Turno, (turno) => turno.empleados, { nullable: true })
  @JoinColumn({ name: 'turno_id' })
  turno: Turno;

  @ManyToOne(() => CentroCosto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'centro_costo_id' })
  centroCosto: CentroCosto | null;

  @ManyToOne(() => Empleado, (jefe) => jefe.subordinados, { nullable: true })
  @JoinColumn({ name: 'jefe_id' })
  jefe: Empleado;

  @OneToMany(() => Empleado, (subordinado) => subordinado.jefe)
  subordinados: Empleado[];

  @OneToOne(() => Usuarios)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;

  @OneToMany(() => Contrato, (contrato) => contrato.empleado)
  contratos: Contrato[];

  @OneToMany(() => Asistencia, (asistencia) => asistencia.empleado)
  asistencias: Asistencia[];

  @OneToMany(() => SolicitudPermiso, (solicitud) => solicitud.empleado)
  solicitudesPermiso: SolicitudPermiso[];

  @OneToMany(() => PeriodoVacacional, (periodo) => periodo.empleado)
  periodosVacacionales: PeriodoVacacional[];
}
