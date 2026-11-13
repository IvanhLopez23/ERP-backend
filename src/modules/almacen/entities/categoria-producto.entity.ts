import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('categorias_producto')
export class CategoriaProducto extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  padreId: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => CategoriaProducto, (categoria) => categoria.subcategorias)
  @JoinColumn({ name: 'padre_id' })
  padre: CategoriaProducto;

  @OneToMany(() => CategoriaProducto, (categoria) => categoria.padre)
  subcategorias: CategoriaProducto[];
}
