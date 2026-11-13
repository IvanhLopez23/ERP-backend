import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BrandingColorsDto } from './branding-colors.dto';

export class BrandingResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'AuraERP' })
  appName: string;

  @ApiProperty({ example: 'i-heroicons-cube-transparent' })
  sidebarIcon: string;

  @ApiPropertyOptional({
    example: '/uploads/branding/logo.png',
    nullable: true,
  })
  logoUrl: string | null;

  @ApiPropertyOptional({
    example: '/uploads/branding/login.png',
    nullable: true,
  })
  loginLogoUrl: string | null;

  @ApiProperty({ example: '/favicon.ico' })
  faviconUrl: string;

  @ApiProperty({
    example: 1.5,
    description: 'Tamaño/radio global de los iconos',
  })
  radio: number;

  @ApiProperty({
    example: 'Public Sans',
    description: 'Fuente tipográfica global',
  })
  fuente: string;

  @ApiProperty({ type: () => BrandingColorsDto })
  colors: BrandingColorsDto;

  @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
  updatedAt: Date;
}
