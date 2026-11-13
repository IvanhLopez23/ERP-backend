import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Almacen } from './almacen.entity';
import { CorteInventarioDetalle } from './corte-inventario-detalle.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('cortes_inventario')
export class CorteInventario extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Almacen, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;

  @Column({ type: 'int' })
  anio: number;

  @Column({ type: 'int' })
  mes: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  fechaCorte: Date;

  @Column({ type: 'int', nullable: true })
  usuarioId: number | null;

  @Column({ type: 'int', default: 0 })
  totalProductos: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalUnidades: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalValorCosto: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalValorVenta: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @OneToMany(
    () => CorteInventarioDetalle,
    (detalle) => detalle.corte,
  )
  detalles: CorteInventarioDetalle[];
}
