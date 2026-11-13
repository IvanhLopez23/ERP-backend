import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrdenSalida } from './orden-salida.entity';
import { Producto } from './producto.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('ordenes_salida_detalle')
export class OrdenSalidaDetalle extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => OrdenSalida, (orden) => orden.detalles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orden_id' })
  orden: OrdenSalida;

  @ManyToOne(() => Producto, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column({ type: 'varchar', length: 50 })
  codigo: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unidadMedida: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  cantidad: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  existenciaAnterior: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  existenciaNueva: number;
}
