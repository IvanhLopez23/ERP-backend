import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDetalleOrdenTrabajoDto } from './create-detalle-orden.dto';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateOrdenTrabajoDto {
  @ApiProperty({
    description: 'publicId del equipo',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsNotEmpty()
  @IsPublicId()
  equipoId: string;

  @ApiPropertyOptional({ description: 'publicId del plan de mantenimiento' })
  @IsOptional()
  @IsPublicId()
  planMantenimientoId?: string;

  @ApiProperty({
    description: 'Descripción del trabajo',
    example: 'Cambio de aceite y filtros',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({
    description: 'Fecha programada (YYYY-MM-DD)',
    example: '2024-02-15',
  })
  @IsString()
  @IsNotEmpty()
  fechaProgramada: string;

  @ApiPropertyOptional({ description: 'Costo estimado', example: 1500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costo?: number;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'publicId del empleado asignado (RH)' })
  @IsOptional()
  @IsPublicId()
  atendidoPor?: string;

  @ApiPropertyOptional({
    description: 'Detalles de la orden de trabajo',
    type: [CreateDetalleOrdenTrabajoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleOrdenTrabajoDto)
  @IsOptional()
  detalles?: CreateDetalleOrdenTrabajoDto[];
}
