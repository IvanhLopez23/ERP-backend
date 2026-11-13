import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';
import { MenuComedorItem } from './menu-comedor-item.entity';
import { SolicitudComedor } from './solicitud-comedor.entity';

@Entity('menus_comedor')
export class MenuComedor extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ length: 20 })
  periodicidad: string;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date' })
  fechaFin: Date;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @OneToMany(() => MenuComedorItem, (item) => item.menu, { cascade: true })
  items: MenuComedorItem[];

  @OneToMany(() => SolicitudComedor, (solicitud) => solicitud.menu)
  solicitudes: SolicitudComedor[];
}
