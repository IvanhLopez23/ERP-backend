import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Producto } from './producto.entity';
import { Almacen } from './almacen.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('inventario')
@Unique(['productoId', 'almacenId'])
export class Inventario extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productoId: number;

  @Column()
  almacenId: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  existencia: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => Producto, (producto) => producto.inventarios)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => Almacen, (almacen) => almacen.inventarios)
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;
}
