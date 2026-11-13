import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateProductoDto {
  @ApiProperty({
    description: 'Código único del producto (SKU)',
    example: 'PROD-001',
  })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Laptop HP ProBook 450',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción del producto',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'Precio de costo',
    example: 15000.5,
  })
  @IsNumber()
  @Min(0)
  precioCosto: number;

  @ApiProperty({
    description: 'Precio de venta',
    example: 19999.99,
  })
  @IsNumber()
  @Min(0)
  precioVenta: number;

  @ApiProperty({
    description: 'publicId de la unidad de medida',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsNotEmpty()
  unidadMedidaId: string;

  @ApiPropertyOptional({
    description: 'publicId de la categoría del producto',
  })
  @IsOptional()
  @IsPublicId()
  categoriaId?: string;

  @ApiPropertyOptional({
    description: 'URL de la foto del producto',
  })
  @IsString()
  @IsOptional()
  foto?: string;
}
