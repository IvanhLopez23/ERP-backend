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

@Entity('declaraciones_iva')
@Index(['anio', 'mes'], { unique: true })
@Index(['anio'])
export class DeclaracionIva extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  anio: number;

  @Column()
  mes: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  trasladado: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  acreditable: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  neto: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  porPagar: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  saldoFavor: number;

  @Column({ length: 20, default: 'declarada' })
  estatus: string;

  @Column({ type: 'int', nullable: true })
  polizaId: number | null;

  @Column()
  usuarioId: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => Poliza, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'poliza_id' })
  poliza: Poliza | null;

  @ManyToOne(() => Usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;
}
