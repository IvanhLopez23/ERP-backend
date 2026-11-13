import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Inventario } from './inventario.entity';
import { MovimientoInventario } from './movimiento-inventario.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('almacenes')
export class Almacen extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ length: 255, nullable: true })
  ubicacion: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @OneToMany(() => Inventario, (inventario) => inventario.almacen)
  inventarios: Inventario[];

  @OneToMany(() => MovimientoInventario, (movimiento) => movimiento.almacen)
  movimientos: MovimientoInventario[];
}
