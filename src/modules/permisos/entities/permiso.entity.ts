import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Roles } from '../../roles/entities/role.entity';
import { Usuarios } from '../../usuarios/entities/index';
import { Pantalla } from 'src/modules/pantallas/entities/pantalla.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('permisos')
@Unique(['rolId', 'pantallaId'])
export class Permiso extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  pantallaId: number;

  @Column({ nullable: false })
  rolId: number;

  @Column({ nullable: false })
  ver: boolean;

  @Column({ nullable: false })
  crear: boolean;

  @Column({ nullable: false })
  editar: boolean;

  @Column({ nullable: false })
  eliminar: boolean;

  @Column({ nullable: false })
  adjuntos: boolean;

  @Column({ nullable: false })
  reportes: boolean;

  @Column({ default: () => 'NOW()', select: false })
  fechaActualizacion: Date;

  @Column({ nullable: true, select: false })
  usuarioId: number;

  @ManyToOne(() => Pantalla, (pantalla) => pantalla.permisos)
  @JoinColumn({ name: 'pantalla_id' })
  pantalla: Pantalla;

  @ManyToOne(() => Usuarios, (usuario) => usuario.permisos)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;

  @ManyToOne(() => Roles, (rol) => rol.permisos)
  @JoinColumn({ name: 'rol_id' })
  rol: Roles;
}
