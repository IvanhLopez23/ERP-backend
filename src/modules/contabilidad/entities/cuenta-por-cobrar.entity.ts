import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';
import { Usuarios } from 'src/modules/usuarios/entities';
import { Cliente } from '../../ventas/entities/cliente.entity';
import { Venta } from '../../ventas/entities/venta.entity';
import { Poliza } from './poliza.entity';
import { CuentaContable } from './cuenta-contable.entity';
import { CobroCxC } from './cobro-cxc.entity';

@Entity('cuentas_por_cobrar')
@Index(['ventaId'])
@Index(['clienteId'])
@Index(['estatus'])
@Index(['fechaVencimiento'])
export class CuentaPorCobrar extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30, unique: true })
  folio: string;

  @Column({ type: 'int', nullable: true })
  ventaId: number | null;

  @Column()
  clienteId: number;

  @Column({ type: 'date' })
  fechaEmision: string;

  @Column({ type: 'date' })
  fechaVencimiento: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  monto: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  iva: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  saldo: number;

  @Column({ length: 20, default: 'pendiente' })
  estatus: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column()
  usuarioId: number;

  @Column({ type: 'int', nullable: true })
  polizaId: number | null;

  @Column({ type: 'int', nullable: true })
  polizaCancelacionId: number | null;

  @Column({ type: 'int', nullable: true })
  cuentaContableId: number | null;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => Venta, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'venta_id' })
  venta: Venta | null;

  @ManyToOne(() => Cliente, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => Usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;

  @ManyToOne(() => Poliza, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'poliza_id' })
  poliza: Poliza | null;

  @ManyToOne(() => Poliza, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'poliza_cancelacion_id' })
  polizaCancelacion: Poliza | null;

  @ManyToOne(() => CuentaContable, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cuenta_contable_id' })
  cuentaContable: CuentaContable | null;

  @OneToMany(() => CobroCxC, (cobro) => cobro.cuentaPorCobrar, {
    cascade: true,
  })
  cobros: CobroCxC[];
}
