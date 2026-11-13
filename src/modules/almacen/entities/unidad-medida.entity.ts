import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Producto } from './producto.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('unidades_medida')
export class UnidadMedida extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  nombre: string;

  @Column({ length: 10 })
  abreviatura: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @OneToMany(() => Producto, (producto) => producto.unidadMedida)
  productos: Producto[];
}
