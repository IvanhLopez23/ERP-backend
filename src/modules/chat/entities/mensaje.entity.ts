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

@Entity('mensajes')
export class Mensaje extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  conversacionId: number;

  @Column()
  usuarioId: number;

  @Column({ type: 'text' })
  contenido: string;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(() => Conversacion, (c) => c.mensajes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversacion_id' })
  conversacion: Conversacion;

  @ManyToOne(() => Usuarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;
}
