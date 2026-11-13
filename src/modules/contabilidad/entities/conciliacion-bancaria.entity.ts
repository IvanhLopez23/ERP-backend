import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';
import { Usuarios } from 'src/modules/usuarios/entities';
import { MovimientoBancario } from './movimiento-bancario.entity';
import { PolizaDetalle } from './poliza-detalle.entity';

@Entity('conciliaciones_bancarias')
@Index(['movimientoBancarioId'])
@Index(['polizaDetalleId'], { unique: true })
@Index(['movimientoBancarioId', 'polizaDetalleId'], { unique: true })
export class ConciliacionBancaria extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  movimientoBancarioId: number;

  @Column()
  polizaDetalleId: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  montoAplicado: number;

  @Column()
  usuarioId: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @ManyToOne(
    () => MovimientoBancario,
    (movimiento) => movimiento.conciliaciones,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'movimiento_bancario_id' })
  movimiento: MovimientoBancario;

  @ManyToOne(() => PolizaDetalle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poliza_detalle_id' })
  polizaDetalle: PolizaDetalle;

  @ManyToOne(() => Usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;
}
