import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Producto } from './producto.entity';
import { Almacen } from './almacen.entity';
import { Usuarios } from 'src/modules/usuarios/entities/index';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('movimientos_inventario')
export class MovimientoInventario extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productoId: number;

  @Column()
  almacenId: number;

  @Column({ length: 20 })
  tipo: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  existenciaAnterior: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  existenciaNueva: number;

  @Column({ length: 100, nullable: true })
  referencia: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column()
  usuarioId: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(() => Producto, (producto) => producto.movimientos)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => Almacen, (almacen) => almacen.movimientos)
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;

  @ManyToOne(() => Usuarios)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;
}
