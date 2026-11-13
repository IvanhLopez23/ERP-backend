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
import { Proveedor } from '../../compras/entities/proveedor.entity';
import { Compra } from '../../compras/entities/compra.entity';
import { Poliza } from './poliza.entity';
import { CuentaContable } from './cuenta-contable.entity';
import { PagoCxP } from './pago-cxp.entity';

@Entity('cuentas_por_pagar')
@Index(['compraId'])
@Index(['proveedorId'])
@Index(['estatus'])
@Index(['fechaVencimiento'])
export class CuentaPorPagar extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30, unique: true })
  folio: string;

  @Column({ type: 'int', nullable: true })
  compraId: number | null;

  @Column()
  proveedorId: number;

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

  @ManyToOne(() => Compra, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'compra_id' })
  compra: Compra | null;

  @ManyToOne(() => Proveedor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;

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

  @OneToMany(() => PagoCxP, (pago) => pago.cuentaPorPagar, {
    cascade: true,
  })
  pagos: PagoCxP[];
}
