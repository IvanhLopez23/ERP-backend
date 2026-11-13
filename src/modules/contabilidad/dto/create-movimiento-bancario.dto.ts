import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovimientoBancarioDto {
  @ApiProperty({ example: '2026-11-10' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: 'SPEI recibido de cliente' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  descripcion: string;

  @ApiPropertyOptional({ example: 'SPEI-123' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referencia?: string;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Cargo (entrada de efectivo a la cuenta)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  cargo?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Abono (salida de efectivo de la cuenta)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  abono?: number;

  @ApiPropertyOptional({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  saldo?: number;
}
