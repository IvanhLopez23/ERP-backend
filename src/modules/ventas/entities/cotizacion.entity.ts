import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { DetalleCotizacion } from './detalle-cotizacion.entity';
import { Empleado } from 'src/modules/rh/entities/empleado.entity';
import { Usuarios } from 'src/modules/usuarios/entities/index';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('cotizaciones')
export class Cotizacion extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  folio: string;

  @Column()
  clienteId: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'int', default: 30 })
  diasValidez: number;

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

  @Column()
  usuarioId: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => Cliente, (cliente) => cliente.cotizaciones)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => Empleado)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: Empleado;

  @ManyToOne(() => Usuarios)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;

  @OneToMany(() => DetalleCotizacion, (det) => det.cotizacion, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  detalles: DetalleCotizacion[];
}
