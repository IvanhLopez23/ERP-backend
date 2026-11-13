import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuarios } from 'src/modules/usuarios/entities/usuario.entity';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('auditoria')
export class Auditoria extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  usuarioId: number;

  @Column({ length: 10 })
  metodo: string;

  @Column({ length: 255 })
  endpoint: string;

  @Column({ type: 'jsonb', nullable: true })
  parametros: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  body: unknown;

  @Column({ type: 'jsonb', nullable: true })
  respuesta: unknown;

  @Column({ type: 'int' })
  statusCode: number;

  @Column({ type: 'int' })
  duracionMs: number;

  @Column({ length: 100, nullable: true })
  ip: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ default: true })
  exitoso: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(() => Usuarios, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;
}
