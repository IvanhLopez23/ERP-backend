import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrdenTrabajo } from './orden-trabajo.entity';

import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('detalles_orden_trabajo')
export class DetalleOrdenTrabajo extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ordenTrabajoId: number;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ default: false })
  completado: boolean;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @ManyToOne(() => OrdenTrabajo, (orden) => orden.detalles)
  @JoinColumn({ name: 'orden_trabajo_id' })
  ordenTrabajo: OrdenTrabajo;
}
