import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';
import { Usuarios } from 'src/modules/usuarios/entities';
import { Poliza } from './poliza.entity';
import { CuentaPorPagar } from './cuenta-por-pagar.entity';

@Entity('pagos_cxp')
@Index(['cuentaPorPagarId'])
export class PagoCxP extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cuentaPorPagarId: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  monto: number;

  @Column({ length: 20 })
  metodoPago: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column()
  usuarioId: number;

  @Column({ type: 'int', nullable: true })
  polizaId: number | null;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(() => CuentaPorPagar, (cuenta) => cuenta.pagos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cuenta_por_pagar_id' })
  cuentaPorPagar: CuentaPorPagar;

  @ManyToOne(() => Usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;

  @ManyToOne(() => Poliza, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'poliza_id' })
  poliza: Poliza | null;
}
