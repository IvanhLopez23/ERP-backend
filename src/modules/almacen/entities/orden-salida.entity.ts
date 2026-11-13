import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Almacen } from './almacen.entity';
import { OrdenSalidaDetalle } from './orden-salida-detalle.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('ordenes_salida')
export class OrdenSalida extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  folio: string;

  @ManyToOne(() => Almacen, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;

  @Column({ type: 'date' })
  fechaSalida: Date;

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ type: 'int', nullable: true })
  usuarioId: number | null;

  @Column({ type: 'int', default: 0 })
  totalProductos: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalUnidades: number;

  @Column({ type: 'varchar', length: 20, default: 'aplicada' })
  estatus: string;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @OneToMany(() => OrdenSalidaDetalle, (detalle) => detalle.orden, {
    cascade: true,
  })
  detalles: OrdenSalidaDetalle[];
}
