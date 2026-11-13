import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { PublicIdEntity } from 'src/core/database/entities/public-id.entity';

export interface BrandingColors {
  headerBg: string;
  headerText: string;
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
}

@Entity('branding')
export class Branding extends PublicIdEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 60, default: 'AuraERP' })
  appName: string;

  @Column({
    type: 'varchar',
    length: 80,
    default: 'i-heroicons-cube-transparent',
  })
  sidebarIcon: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  loginLogoUrl: string | null;

  @Column({ type: 'varchar', length: 500, default: '/favicon.ico' })
  faviconUrl: string;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 4,
    default: 1.5,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value === null || value === undefined ? value : Number(value),
    },
  })
  radio: number;

  @Column({ type: 'varchar', length: 100, default: 'Public Sans' })
  fuente: string;

  @Column({ type: 'jsonb' })
  colors: BrandingColors;

  @Column({ default: () => 'NOW()' })
  fechaCreacion: Date;

  @Column({ default: () => 'NOW()' })
  fechaActualizacion: Date;
}
