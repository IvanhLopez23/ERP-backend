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
import { CuentaBancaria } from './cuenta-bancaria.entity';

@Entity('reglas_conciliacion_bancaria')
@Index(['activo'])
@Index(['cuentaBancariaId'])
export class ReglaConciliacion extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'int', nullable: true })
  cuentaBancariaId: number | null;

  @Column({ default: 100 })
  prioridad: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ length: 10, default: 'ambos' })
  tipoMovimiento: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenciaContiene: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  descripcionContiene: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  toleranciaMonto: number;

  @Column({ default: 3 })
  toleranciaDias: number;

  @Column()
  usuarioId: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => CuentaBancaria, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cuenta_bancaria_id' })
  cuentaBancaria: CuentaBancaria | null;

  @ManyToOne(() => Usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;
}
