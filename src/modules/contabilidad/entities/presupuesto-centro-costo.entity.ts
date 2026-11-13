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
import { CentroCosto } from './centro-costo.entity';

@Entity('presupuestos_centro_costo')
@Index(['anio', 'mes', 'centroCostoId'], { unique: true })
@Index(['anio'])
export class PresupuestoCentroCosto extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  anio: number;

  @Column()
  mes: number;

  @Column()
  centroCostoId: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  ingresosPresupuestados: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  gastosPresupuestados: number;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column()
  usuarioId: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => CentroCosto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'centro_costo_id' })
  centroCosto: CentroCosto;

  @ManyToOne(() => Usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;
}
