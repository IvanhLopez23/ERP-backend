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
import { Empleado } from 'src/modules/rh/entities/empleado.entity';
import { MenuComedor } from './menu-comedor.entity';
import { SolicitudComedorDetalle } from './solicitud-comedor-detalle.entity';

@Entity('solicitudes_comedor')
@Unique(['empleadoId', 'menuId'])
export class SolicitudComedor extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empleadoId: number;

  @Column()
  menuId: number;

  @Column({ length: 20, default: 'solicitada' })
  estatus: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ default: () => 'NOW()' })
  fechaSolicitud: Date;

  @ManyToOne(() => Empleado, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @ManyToOne(() => MenuComedor, (menu) => menu.solicitudes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'menu_id' })
  menu: MenuComedor;

  @OneToMany(() => SolicitudComedorDetalle, (detalle) => detalle.solicitud, {
    cascade: true,
  })
  detalles: SolicitudComedorDetalle[];
}
