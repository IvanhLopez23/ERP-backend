import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { OneToMany } from 'typeorm';
import { Usuarios } from 'src/modules/usuarios/entities/usuario.entity';
import { Permiso } from 'src/modules/permisos/entities/permiso.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('roles')
export class Roles extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: false })
  esAdministrador: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @OneToMany(() => Usuarios, (usuario) => usuario.rol)
  usuarios: Usuarios[];

  @OneToMany(() => Permiso, (permiso) => permiso.rol, { cascade: true })
  permisos: Permiso[];
}
