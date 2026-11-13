import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Permiso } from 'src/modules/permisos/entities/permiso.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('pantallas')
export class Pantalla extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ unique: true })
  ruta: string;

  @Column()
  icono: string;

  @Column()
  orden: number;

  @Column({ nullable: true })
  padreId: number;

  @Column({ nullable: true })
  subMenu: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ nullable: true })
  modulo: string;

  @Column({ default: () => 'NOW()', select: false })
  fechaActualizacion: Date;

  @OneToMany(() => Permiso, (permiso) => permiso.pantalla, { cascade: true })
  permisos: Permiso[];
}
