import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Compra } from './compra.entity';
import { Producto } from 'src/modules/almacen/entities/producto.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('detalles_compra')
export class DetalleCompra extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  compraId: number;

  @Column()
  productoId: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  precioUnitario: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @ManyToOne(() => Compra, (compra) => compra.detalles)
  @JoinColumn({ name: 'compra_id' })
  compra: Compra;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;
}
