import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Refaccion } from './refaccion.entity';
import { Usuarios } from 'src/modules/usuarios/entities/index';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('movimientos_refacciones')
export class MovimientoRefaccion extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  refaccionId: number;

  @Column({ nullable: true })
  ordenTrabajoId: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  cantidad: number;

  @Column({ length: 20 })
  tipo: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column()
  usuarioId: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(() => Refaccion, (ref) => ref.movimientos)
  @JoinColumn({ name: 'refaccion_id' })
  refaccion: Refaccion;

  @ManyToOne(() => Usuarios)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;
}
