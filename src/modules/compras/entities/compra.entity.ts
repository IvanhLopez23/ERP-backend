import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Proveedor } from './proveedor.entity';
import { DetalleCompra } from './detalle-compra.entity';
import { Almacen } from '../../almacen/entities/almacen.entity';
import { Usuarios } from 'src/modules/usuarios/entities/index';
import { CentroCosto } from '../../contabilidad/entities/centro-costo.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('compras')
export class Compra extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  folio: string;

  @Column()
  proveedorId: number;

  @Column({ type: 'date' })
  fechaCompra: Date;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  iva: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total: number;

  @Column({ length: 20, default: 'pendiente' })
  estatus: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'int', nullable: true })
  centroCostoId: number | null;

  @Column()
  usuarioId: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.compras)
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;

  @ManyToOne(() => Almacen, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen | null;

  @ManyToOne(() => Usuarios)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;

  @ManyToOne(() => CentroCosto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'centro_costo_id' })
  centroCosto: CentroCosto | null;

  @OneToMany(() => DetalleCompra, (detalle) => detalle.compra, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  detalles: DetalleCompra[];
}
