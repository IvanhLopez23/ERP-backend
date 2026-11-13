import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuarios } from 'src/modules/usuarios/entities/usuario.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('refresh_tokens')
export class RefreshToken extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  token: string;

  @Column()
  usuarioId: number;

  @ManyToOne(() => Usuarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @Column({ default: () => 'NOW()' })
  createdAt: Date;
}
