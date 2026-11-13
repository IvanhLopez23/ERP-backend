import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Usuarios } from 'src/modules/usuarios/entities/usuario.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('bitacora_accesos')
export class BitacoraAcceso extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'acceso', nullable: true })
  acceso: boolean;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ nullable: true })
  usuarioId: number;

  @ManyToOne(() => Usuarios, (usuario) => usuario.bitacoras)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;
}
