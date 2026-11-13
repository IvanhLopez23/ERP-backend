import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empleado } from './empleado.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('contratos')
export class Contrato extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empleadoId: number;

  @Column({ length: 20 })
  tipo: string;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date', nullable: true })
  fechaFin: Date;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  salario: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => Empleado, (empleado) => empleado.contratos)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;
}
