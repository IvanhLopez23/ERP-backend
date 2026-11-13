import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Roles } from 'src/modules/roles/entities/role.entity';
import { Perfil } from './perfil.entity';
import { Permiso } from 'src/modules/permisos/entities/permiso.entity';
import { BitacoraAcceso } from 'src/modules/bitacora-accesos/entities/bitacora-acceso.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('usuarios')
export class Usuarios extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombreUsuario: string;

  @Column({ unique: true })
  correo: string;

  @Column({ select: false })
  contrasena: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @Column()
  rolId: number;

  @ManyToOne(() => Roles, (rol) => rol.usuarios)
  @JoinColumn({ name: 'rol_id' })
  rol: Roles;

  @OneToOne(() => Perfil, (perfil) => perfil.usuario, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  perfil: Perfil;

  @OneToMany(() => Permiso, (permiso) => permiso.usuario, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  permisos: Permiso[];

  @OneToMany(() => BitacoraAcceso, (bitacora) => bitacora.usuario)
  bitacoras: BitacoraAcceso[];
}
