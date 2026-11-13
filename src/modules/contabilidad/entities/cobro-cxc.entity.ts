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
import { CuentaPorCobrar } from './cuenta-por-cobrar.entity';

@Entity('cobros_cxc')
@Index(['cuentaPorCobrarId'])
export class CobroCxC extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cuentaPorCobrarId: number;

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

  @ManyToOne(() => CuentaPorCobrar, (cuenta) => cuenta.cobros, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cuenta_por_cobrar_id' })
  cuentaPorCobrar: CuentaPorCobrar;

  @ManyToOne(() => Usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;

  @ManyToOne(() => Poliza, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'poliza_id' })
  poliza: Poliza | null;
}
