import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversacion } from './conversacion.entity';
import { Usuarios } from 'src/modules/usuarios/entities/usuario.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('conversaciones_participantes')
export class ConversacionParticipante extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  conversacionId: number;

  @Column()
  usuarioId: number;

  @Column({ type: 'timestamp', nullable: true })
  ultimaLectura: Date;

  @ManyToOne(() => Conversacion, (c) => c.participantes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversacion_id' })
  conversacion: Conversacion;

  @ManyToOne(() => Usuarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;
}
