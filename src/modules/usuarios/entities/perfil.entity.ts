import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Usuarios } from './usuario.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity()
export class Perfil extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 150 })
  apellidoPaterno: string;

  @Column({ type: 'varchar', length: 150 })
  apellidoMaterno: string;

  @Column({ type: 'varchar', length: 1, nullable: true })
  genero: string;

  @Column({ type: 'date', nullable: true })
  fechaNacimiento: Date;

  @Column({ type: 'varchar', length: 250, nullable: true })
  foto: string;

  @Column()
  usuarioId: number;

  @OneToOne(() => Usuarios, (usuario) => usuario.perfil)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;
}
