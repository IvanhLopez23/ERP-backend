import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ConversacionParticipante } from './conversacion-participante.entity';
import { Mensaje } from './mensaje.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('conversaciones')
export class Conversacion extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  esGrupo: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nombre: string | null;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @OneToMany(() => ConversacionParticipante, (cp) => cp.conversacion, {
    cascade: true,
  })
  participantes: ConversacionParticipante[];

  @OneToMany(() => Mensaje, (m) => m.conversacion, { cascade: true })
  mensajes: Mensaje[];
}
