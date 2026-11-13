import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Empleado } from './empleado.entity';
import { Puesto } from './puesto.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('departamentos')
export class Departamento extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @OneToMany(() => Empleado, (empleado) => empleado.departamento)
  empleados: Empleado[];

  @OneToMany(() => Puesto, (puesto) => puesto.departamento)
  puestos: Puesto[];
}
