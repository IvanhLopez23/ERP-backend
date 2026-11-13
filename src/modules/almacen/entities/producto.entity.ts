import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { CategoriaProducto } from './categoria-producto.entity';
import { UnidadMedida } from './unidad-medida.entity';
import { Inventario } from './inventario.entity';
import { MovimientoInventario } from './movimiento-inventario.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('productos')
export class Producto extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  codigo: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  precioCosto: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  precioVenta: number;

  @Column()
  unidadMedidaId: number;

  @Column({ nullable: true })
  categoriaId: number;

  @Column({ length: 255, nullable: true })
  foto: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => UnidadMedida, (unidad) => unidad.productos)
  @JoinColumn({ name: 'unidad_medida_id' })
  unidadMedida: UnidadMedida;

  @ManyToOne(() => CategoriaProducto, (categoria) => categoria.subcategorias)
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaProducto;

  @OneToMany(() => Inventario, (inventario) => inventario.producto)
  inventarios: Inventario[];

  @OneToMany(() => MovimientoInventario, (movimiento) => movimiento.producto)
  movimientos: MovimientoInventario[];
}
