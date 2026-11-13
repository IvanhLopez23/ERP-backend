import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';
import { MenuComedor } from './menu-comedor.entity';
import { SolicitudComedorDetalle } from './solicitud-comedor-detalle.entity';

@Entity('menus_comedor_items')
@Unique(['menuId', 'fecha', 'tipoComida'])
export class MenuComedorItem extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  menuId: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ length: 20 })
  tipoComida: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => MenuComedor, (menu) => menu.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: MenuComedor;

  @OneToMany(() => SolicitudComedorDetalle, (detalle) => detalle.menuItem)
  detallesSolicitud: SolicitudComedorDetalle[];
}
