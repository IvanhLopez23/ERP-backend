import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';
import { TIPOS_CENTRO_COSTO } from './create-centro-costo.dto';

export class PresupuestoCentroReporteQueryDto {
  @ApiPropertyOptional({ example: 2026, description: 'Default: año actual' })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  anio?: number;

  @ApiPropertyOptional({ description: 'publicId del centro de costo' })
  @IsPublicId()
  @IsOptional()
  centroCostoId?: string;

  @ApiPropertyOptional({ enum: [...TIPOS_CENTRO_COSTO] })
  @IsIn([...TIPOS_CENTRO_COSTO])
  @IsOptional()
  tipo?: string;
}
