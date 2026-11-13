import { PartialType } from '@nestjs/swagger';
import { CreatePlanMantenimientoDto } from './create-plan-mantenimiento.dto';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class UpdatePlanMantenimientoDto extends PartialType(
  CreatePlanMantenimientoDto,
) {
  @ApiPropertyOptional({ description: 'publicId del equipo' })
  @IsNotEmpty()
  @IsPublicId()
  equipoId: string;

  @ApiPropertyOptional({ description: 'Descripción del plan' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional({ description: 'Tipo de mantenimiento' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['preventivo', 'predictivo'])
  tipo: string;

  @ApiPropertyOptional({ description: 'Periodicidad' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['diario', 'semanal', 'mensual', 'trimestral', 'semestral', 'anual'])
  periodicidad: string;

  @ApiPropertyOptional({ description: 'Intervalo numérico' })
  @IsNumber()
  @IsOptional()
  intervalo?: number;

  @ApiPropertyOptional({ description: 'Fecha próxima ejecución (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  fechaProximaEjecucion?: string;
}
