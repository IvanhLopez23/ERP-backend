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
import { PeriodoContable } from './periodo-contable.entity';
import { PolizaDetalle } from './poliza-detalle.entity';
import { CentroCosto } from './centro-costo.entity';

@Entity('polizas')
@Index(['periodoId'])
@Index(['fecha'])
@Index(['estatus'])
export class Poliza extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30, unique: true })
  folio: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ length: 20 })
  tipo: string;

  @Column({ length: 255 })
  concepto: string;

  @Column({ length: 20, default: 'borrador' })
  estatus: string;

  @Column()
  periodoId: number;

  @Column()
  usuarioId: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalDebe: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalHaber: number;

  @Column({ type: 'int', nullable: true })
  centroCostoId: number | null;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => PeriodoContable, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'periodo_id' })
  periodo: PeriodoContable;

  @ManyToOne(() => Usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;

  @ManyToOne(() => CentroCosto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'centro_costo_id' })
  centroCosto: CentroCosto | null;

  @OneToMany(() => PolizaDetalle, (detalle) => detalle.poliza, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  detalles: PolizaDetalle[];
}
