import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MovimientoRefaccion } from './movimiento-refaccion.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('refacciones')
export class Refaccion extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  productoId: number;

  @Column({ type: 'int', default: 0 })
  stockMinimo: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @OneToMany(() => MovimientoRefaccion, (mov) => mov.refaccion)
  movimientos: MovimientoRefaccion[];
}
