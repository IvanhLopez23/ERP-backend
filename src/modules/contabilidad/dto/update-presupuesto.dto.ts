import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';
import { CreatePresupuestoDto } from './create-presupuesto.dto';

export class UpdatePresupuestoDto extends PartialType(CreatePresupuestoDto) {}

export class PresupuestosQueryDto {
  @ApiPropertyOptional({ example: 2026 })
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
}

export class CrearPresupuestosBulkDto {
  @ApiProperty({ type: [CreatePresupuestoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePresupuestoDto)
  presupuestos: CreatePresupuestoDto[];
}
