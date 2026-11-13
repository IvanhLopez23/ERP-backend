import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';
import { Usuarios } from 'src/modules/usuarios/entities';
import { CuentaBancaria } from './cuenta-bancaria.entity';
import { PolizaDetalle } from './poliza-detalle.entity';
import { ConciliacionBancaria } from './conciliacion-bancaria.entity';

@Entity('movimientos_bancarios')
@Index(['cuentaBancariaId', 'fecha'])
@Index(['polizaDetalleId'], { unique: true })
@Index(['cuentaBancariaId', 'hashImportacion'], { unique: true })
export class MovimientoBancario extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cuentaBancariaId: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ length: 255 })
  descripcion: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  cargo: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  abono: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  saldo: number | null;

  @Column({ type: 'int', nullable: true })
  polizaDetalleId: number | null;

  @Column({ type: 'timestamp', nullable: true })
  conciliadoEn: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  hashImportacion: string | null;

  @Column()
  usuarioId: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => CuentaBancaria, (cuenta) => cuenta.movimientos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cuenta_bancaria_id' })
  cuentaBancaria: CuentaBancaria;

  @ManyToOne(() => PolizaDetalle, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'poliza_detalle_id' })
  polizaDetalle: PolizaDetalle | null;

  @ManyToOne(() => Usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;

  @OneToMany(
    () => ConciliacionBancaria,
    (conciliacion) => conciliacion.movimiento,
    { cascade: true },
  )
  conciliaciones: ConciliacionBancaria[];
}
