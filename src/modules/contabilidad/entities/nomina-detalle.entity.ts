import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';
import { Empleado } from '../../rh/entities/empleado.entity';
import { CentroCosto } from './centro-costo.entity';
import { Nomina } from './nomina.entity';

@Entity('nomina_detalles')
@Index(['nominaId'])
@Index(['empleadoId'])
export class NominaDetalle extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nominaId: number;

  @Column()
  empleadoId: number;

  @Column({ type: 'int', nullable: true })
  centroCostoId: number | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  salarioBase: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  percepciones: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  isr: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  imss: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  otrasDeducciones: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  neto: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(() => Nomina, (nomina) => nomina.detalles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'nomina_id' })
  nomina: Nomina;

  @ManyToOne(() => Empleado, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @ManyToOne(() => CentroCosto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'centro_costo_id' })
  centroCosto: CentroCosto | null;
}
