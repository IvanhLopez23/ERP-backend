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
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateCxpManualDto {
  @ApiProperty({ description: 'publicId del proveedor' })
  @IsPublicId()
  @IsNotEmpty()
  proveedorId: string;

  @ApiProperty({ example: '2026-11-10' })
  @IsDateString()
  fechaEmision: string;

  @ApiPropertyOptional({
    example: '2026-12-10',
    description: 'Default: fechaEmision + 30 días',
  })
  @IsDateString()
  @IsOptional()
  fechaVencimiento?: string;

  @ApiProperty({
    example: 232,
    description: 'Monto total de la cuenta (incluye IVA)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiPropertyOptional({
    example: 32,
    description: 'IVA incluido en el monto. Default: 0',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  iva?: number;

  @ApiPropertyOptional({
    description:
      'publicId de la cuenta de cargo (gasto o activo). Default: 5102 Gastos de operación',
  })
  @IsPublicId()
  @IsOptional()
  cuentaCargoId?: string;

  @ApiProperty({ example: 'Renta de oficina' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  concepto: string;

  @ApiPropertyOptional({
    description: 'publicId del centro de costo/área/proyecto',
  })
  @IsPublicId()
  @IsOptional()
  centroCostoId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observaciones?: string;
}
