import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CorteInventario } from './corte-inventario.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('cortes_inventario_detalle')
export class CorteInventarioDetalle extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CorteInventario, (corte) => corte.detalles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'corte_id' })
  corte: CorteInventario;

  @Column({ type: 'varchar', length: 50 })
  codigo: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  categoria: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unidadMedida: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  existencia: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  precioCosto: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  precioVenta: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  valorCosto: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  valorVenta: number;
}
