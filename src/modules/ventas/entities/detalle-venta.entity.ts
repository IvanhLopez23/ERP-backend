import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Venta } from './venta.entity';
import { Producto } from 'src/modules/almacen/entities/producto.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('detalles_venta')
export class DetalleVenta extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ventaId: number;

  @Column()
  productoId: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  precioUnitario: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @ManyToOne(() => Venta, (venta) => venta.detalles)
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;
}
