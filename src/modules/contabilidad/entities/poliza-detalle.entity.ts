import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';
import { CuentaContable } from './cuenta-contable.entity';
import { Poliza } from './poliza.entity';
import { CentroCosto } from './centro-costo.entity';

@Entity('polizas_detalles')
@Index(['polizaId'])
@Index(['cuentaId'])
export class PolizaDetalle extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  polizaId: number;

  @Column()
  cuentaId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  concepto: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  debe: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  haber: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia: string | null;

  @Column({ default: 1 })
  orden: number;

  @Column({ type: 'int', nullable: true })
  centroCostoId: number | null;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(() => Poliza, (poliza) => poliza.detalles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'poliza_id' })
  poliza: Poliza;

  @ManyToOne(() => CuentaContable, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cuenta_id' })
  cuenta: CuentaContable;

  @ManyToOne(() => CentroCosto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'centro_costo_id' })
  centroCosto: CentroCosto | null;
}
