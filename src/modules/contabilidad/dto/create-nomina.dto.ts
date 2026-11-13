import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class AjusteNominaEmpleadoDto {
  @ApiProperty({ description: 'publicId del empleado' })
  @IsPublicId()
  empleadoId: string;

  @ApiPropertyOptional({
    description: 'Percepciones del periodo. Default: salario del empleado',
    example: 25000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  percepciones?: number;

  @ApiPropertyOptional({ example: 2500, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  isr?: number;

  @ApiPropertyOptional({ example: 800, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  imss?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  otrasDeducciones?: number;
}

export class CreateNominaDto {
  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  anio: number;

  @ApiProperty({ example: 11, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @ApiPropertyOptional({
    example: '2026-11-30',
    description: 'Fecha de pago/provisión. Default: hoy',
  })
  @IsDateString()
  @IsOptional()
  fecha?: string;

  @ApiPropertyOptional({
    example: 1200,
    description: 'IMSS patronal del periodo (gasto adicional)',
    default: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  imssPatronal?: number;

  @ApiPropertyOptional({
    example: 800,
    description: 'Provisión de prestaciones del periodo',
    default: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  provisionPrestaciones?: number;

  @ApiPropertyOptional({
    type: [AjusteNominaEmpleadoDto],
    description:
      'Ajustes por empleado. Si se omite, se incluyen todos los empleados activos con salario.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AjusteNominaEmpleadoDto)
  @IsOptional()
  empleados?: AjusteNominaEmpleadoDto[];
}
