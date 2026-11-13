import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TIPOS_CENTRO_COSTO = ['centro_costo', 'area', 'proyecto'] as const;

export class CreateCentroCostoDto {
  @ApiProperty({ example: 'CC-ADMIN' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  codigo: string;

  @ApiProperty({ example: 'Administración' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({
    enum: [...TIPOS_CENTRO_COSTO],
    default: 'centro_costo',
  })
  @IsIn([...TIPOS_CENTRO_COSTO])
  @IsOptional()
  tipo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ default: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
