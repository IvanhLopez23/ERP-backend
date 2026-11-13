import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateMovimientoInventarioDto {
  @ApiProperty({
    description: 'publicId del producto',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsNotEmpty()
  productoId: string;

  @ApiProperty({
    description: 'publicId del almacén',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsNotEmpty()
  almacenId: string;

  @ApiProperty({
    description: 'Tipo de movimiento',
    example: 'entrada',
    enum: ['entrada', 'salida', 'ajuste'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['entrada', 'salida', 'ajuste'])
  tipo: string;

  @ApiProperty({
    description: 'Cantidad del movimiento',
    example: 10,
  })
  @IsNumber()
  @Min(0)
  cantidad: number;

  @ApiPropertyOptional({
    description: 'Referencia del movimiento (ej. folio de compra)',
    example: 'CMP-20240101-0001',
  })
  @IsString()
  @IsOptional()
  referencia?: string;

  @ApiPropertyOptional({
    description: 'Observaciones del movimiento',
    example: 'Ajuste por inventario físico',
  })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
