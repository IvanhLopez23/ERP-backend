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
import { CuentaContable } from './cuenta-contable.entity';
import { MovimientoBancario } from './movimiento-bancario.entity';

@Entity('cuentas_bancarias')
@Index(['cuentaContableId'])
export class CuentaBancaria extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ length: 100 })
  banco: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  numeroCuenta: string | null;

  @Column({ type: 'varchar', length: 18, nullable: true })
  clabe: string | null;

  @Column({ length: 3, default: 'MXN' })
  moneda: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  saldoInicial: number;

  @Column()
  cuentaContableId: number;

  @Column({ default: true })
  activo: boolean;

  @Column()
  usuarioId: number;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => CuentaContable, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cuenta_contable_id' })
  cuentaContable: CuentaContable;

  @ManyToOne(() => Usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuarios;

  @OneToMany(
    () => MovimientoBancario,
    (movimiento) => movimiento.cuentaBancaria,
  )
  movimientos: MovimientoBancario[];
}
