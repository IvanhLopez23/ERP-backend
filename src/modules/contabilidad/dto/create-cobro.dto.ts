import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const METODOS_PAGO = [
  'efectivo',
  'transferencia',
  'tarjeta',
  'cheque',
  'otro',
] as const;

export class CreateCobroDto {
  @ApiProperty({ example: '2026-11-10' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiProperty({ enum: [...METODOS_PAGO], example: 'transferencia' })
  @IsIn([...METODOS_PAGO])
  metodoPago: string;

  @ApiPropertyOptional({ example: 'SPEI-123' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referencia?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observaciones?: string;
}
