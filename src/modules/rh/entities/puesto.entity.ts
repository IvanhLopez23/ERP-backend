import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empleado } from './empleado.entity';
import { Departamento } from './departamento.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('puestos')
export class Puesto extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ nullable: true })
  departamentoId: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  salarioMinimo: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  salarioMaximo: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => Departamento, (departamento) => departamento.puestos)
  @JoinColumn({ name: 'departamento_id' })
  departamento: Departamento;

  @OneToMany(() => Empleado, (empleado) => empleado.puesto)
  empleados: Empleado[];
}
