import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export const TIPOS_MOVIMIENTO_REGLA = ['cargo', 'abono', 'ambos'] as const;

export class CreateReglaConciliacionDto {
  @ApiProperty({ example: 'Cobros por referencia IMP' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({
    description:
      'publicId de la cuenta bancaria. Si se omite, aplica a todas las cuentas.',
  })
  @IsPublicId()
  @IsOptional()
  cuentaBancariaId?: string;

  @ApiPropertyOptional({ example: 10, default: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  prioridad?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({
    enum: [...TIPOS_MOVIMIENTO_REGLA],
    default: 'ambos',
  })
  @IsIn([...TIPOS_MOVIMIENTO_REGLA])
  @IsOptional()
  tipoMovimiento?: string;

  @ApiPropertyOptional({
    description: 'Texto que debe contener la referencia del banco o póliza',
    example: 'IMP-',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenciaContiene?: string;

  @ApiPropertyOptional({
    description:
      'Texto que debe contener la descripción del banco o el concepto de la póliza (útil para reglas por cliente/proveedor)',
    example: 'CLIENTE DEMO',
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  descripcionContiene?: string;

  @ApiPropertyOptional({
    description: 'Tolerancia absoluta entre el monto del banco y la póliza',
    example: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  toleranciaMonto?: number;

  @ApiPropertyOptional({
    description: 'Días de tolerancia entre la fecha del banco y la póliza',
    example: 3,
    default: 3,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  @IsOptional()
  toleranciaDias?: number;
}
