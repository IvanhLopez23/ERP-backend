import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreatePlanMantenimientoDto {
  @ApiProperty({
    description: 'publicId del equipo',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsNotEmpty()
  @IsPublicId()
  equipoId: string;

  @ApiProperty({
    description: 'Descripción del plan',
    example: 'Mantenimiento preventivo mensual',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({
    description: 'Tipo de mantenimiento',
    example: 'preventivo',
    enum: ['preventivo', 'predictivo'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['preventivo', 'predictivo'])
  tipo: string;

  @ApiProperty({
    description: 'Periodicidad',
    example: 'mensual',
    enum: ['diario', 'semanal', 'mensual', 'trimestral', 'semestral', 'anual'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['diario', 'semanal', 'mensual', 'trimestral', 'semestral', 'anual'])
  periodicidad: string;

  @ApiPropertyOptional({ description: 'Intervalo numérico', example: 1 })
  @IsNumber()
  @IsOptional()
  intervalo?: number;

  @ApiPropertyOptional({ description: 'Fecha próxima ejecución (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  fechaProximaEjecucion?: string;
}
