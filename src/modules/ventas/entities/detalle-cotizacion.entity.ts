import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cotizacion } from './cotizacion.entity';
import { Producto } from 'src/modules/almacen/entities/producto.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('detalles_cotizacion')
export class DetalleCotizacion extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cotizacionId: number;

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

  @ManyToOne(() => Cotizacion, (cot) => cot.detalles)
  @JoinColumn({ name: 'cotizacion_id' })
  cotizacion: Cotizacion;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;
}
