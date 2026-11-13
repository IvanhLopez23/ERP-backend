import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

@Entity('cuentas_contables')
export class CuentaContable extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  codigo: string;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ length: 20 })
  tipo: string;

  @Column({ length: 10 })
  naturaleza: string;

  @Column({ type: 'int', nullable: true })
  padreId: number | null;

  @Column({ default: 1 })
  nivel: number;

  @Column({ default: true })
  permiteMovimientos: boolean;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;

  @ManyToOne(() => CuentaContable, (cuenta) => cuenta.hijos, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'padre_id' })
  padre: CuentaContable | null;

  @OneToMany(() => CuentaContable, (cuenta) => cuenta.padre)
  hijos: CuentaContable[];
}
