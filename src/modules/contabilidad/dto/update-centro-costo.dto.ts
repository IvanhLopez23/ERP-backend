import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreateCentroCostoDto,
  TIPOS_CENTRO_COSTO,
} from './create-centro-costo.dto';

export class UpdateCentroCostoDto extends PartialType(CreateCentroCostoDto) {}

export class CentrosCostoQueryDto {
  @ApiPropertyOptional({ enum: [...TIPOS_CENTRO_COSTO] })
  @IsIn([...TIPOS_CENTRO_COSTO])
  @IsOptional()
  tipo?: string;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({ example: 'admin' })
  @IsString()
  @IsOptional()
  buscar?: string;
}
