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
import { Poliza } from './poliza.entity';
import { NominaDetalle } from './nomina-detalle.entity';

@Entity('nominas')
@Index(['anio', 'mes'], { unique: true })
@Index(['anio'])
export class Nomina extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  anio: number;

  @Column()
  mes: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ length: 20, default: 'contabilizada' })
  estatus: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalPercepciones: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalIsr: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalImss: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalOtrasDeducciones: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalNeto: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  imssPatronal: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  provisionPrestaciones: number;

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

  @OneToMany(() => NominaDetalle, (detalle) => detalle.nomina, {
    cascade: true,
  })
  detalles: NominaDetalle[];
}
