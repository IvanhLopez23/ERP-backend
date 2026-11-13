import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empleado } from './empleado.entity';
import { Turno } from './turno.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('asistencias')
export class Asistencia extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empleadoId: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time', nullable: true })
  horaEntrada: string;

  @Column({ type: 'time', nullable: true })
  horaSalida: string;

  @Column({ length: 20, default: 'presente' })
  estatus: string;

  @Column({ type: 'int', default: 0 })
  retardoMinutos: number;

  @Column({ type: 'int', default: 0 })
  salidaAnticipadaMinutos: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: {
      to: (valor: number | null) => valor,
      from: (valor: string | null) =>
        valor === null ? null : Number(valor),
    },
  })
  horasTrabajadas: number | null;

  @Column({ nullable: true })
  turnoId: number | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(() => Empleado, (empleado) => empleado.asistencias)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @ManyToOne(() => Turno, (turno) => turno.asistencias, { nullable: true })
  @JoinColumn({ name: 'turno_id' })
  turno: Turno | null;
}
