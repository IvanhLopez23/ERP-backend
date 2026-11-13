import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Compra } from './compra.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('proveedores')
export class Proveedor extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 20, nullable: true })
  rfc: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 100, nullable: true })
  correo: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @OneToMany(() => Compra, (compra) => compra.proveedor)
  compras: Compra[];
}
