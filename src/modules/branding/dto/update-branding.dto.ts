import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { BrandingColorsDto } from './branding-colors.dto';

export class UpdateBrandingDto {
  @ApiProperty({ example: 'AuraERP', minLength: 2, maxLength: 60 })
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  appName: string;

  @ApiProperty({
    example: 'i-heroicons-cube-transparent',
    minLength: 3,
    maxLength: 80,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 80)
  sidebarIcon: string;

  @ApiPropertyOptional({
    example: '/uploads/branding/logo.png',
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string | null;

  @ApiPropertyOptional({
    example: '/uploads/branding/login.png',
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  loginLogoUrl?: string | null;

  @ApiProperty({ example: '/favicon.ico', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  faviconUrl: string;

  @ApiPropertyOptional({
    example: 1.5,
    default: 1.5,
    minimum: 0.5,
    maximum: 100,
    description: 'Tamaño/radio global de los iconos',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  radio?: number;

  @ApiPropertyOptional({
    example: 'Public Sans',
    default: 'Public Sans',
    maxLength: 100,
    description: 'Fuente tipográfica global',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fuente?: string;

  @ApiProperty({ type: () => BrandingColorsDto })
  @ValidateNested()
  @Type(() => BrandingColorsDto)
  colors: BrandingColorsDto;
}
