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

export class CreateCxcManualDto {
  @ApiProperty({ description: 'publicId del cliente' })
  @IsPublicId()
  @IsNotEmpty()
  clienteId: string;

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
    example: 116,
    description: 'Monto total de la cuenta (incluye IVA)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiPropertyOptional({
    example: 16,
    description: 'IVA incluido en el monto. Default: 0',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  iva?: number;

  @ApiPropertyOptional({
    description:
      'publicId de la cuenta de ingreso. Default: 4101 Ventas. Ejemplo: 4102 Otros ingresos',
  })
  @IsPublicId()
  @IsOptional()
  cuentaIngresoId?: string;

  @ApiProperty({ example: 'Servicio de consultoría' })
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
