import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { DetalleVenta } from './detalle-venta.entity';
import { Empleado } from 'src/modules/rh/entities/empleado.entity';
import { Usuarios } from 'src/modules/usuarios/entities/index';
import { CentroCosto } from '../../contabilidad/entities/centro-costo.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('ventas')
export class Venta extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  folio: string;

  @Column()
  clienteId: number;

  @Column({ nullable: true })
  cotizacionId: number;

  @Column({ type: 'date' })
  fechaVenta: Date;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  iva: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total: number;

  @Column({ length: 20, default: 'pendiente' })
  estatus: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ nullable: true })
  vendedorId: number;

  @Column({ type: 'int', nullable: true })
  centroCostoId: number | null;

  @Column()
  usuarioId: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => Cliente, (cliente) => cliente.ventas)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => Empleado)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: Empleado;

  @ManyToOne(() => Usuarios)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;

  @ManyToOne(() => CentroCosto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'centro_costo_id' })
  centroCosto: CentroCosto | null;

  @OneToMany(() => DetalleVenta, (det) => det.venta, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  detalles: DetalleVenta[];
}
