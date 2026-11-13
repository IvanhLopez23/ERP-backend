import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';
import { SolicitudComedor } from './solicitud-comedor.entity';
import { MenuComedorItem } from './menu-comedor-item.entity';

@Entity('solicitudes_comedor_detalles')
@Unique(['solicitudId', 'menuItemId'])
export class SolicitudComedorDetalle extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  solicitudId: number;

  @Column()
  menuItemId: number;

  @ManyToOne(() => SolicitudComedor, (solicitud) => solicitud.detalles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: SolicitudComedor;

  @ManyToOne(() => MenuComedorItem, (item) => item.detallesSolicitud, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: MenuComedorItem;
}
