import { PartialType } from '@nestjs/swagger';
import { CreateProductoDto } from './create-producto.dto';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class UpdateProductoDto extends PartialType(CreateProductoDto) {
  @ApiPropertyOptional({ description: 'Código único del producto (SKU)' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  codigo?: string;

  @ApiPropertyOptional({ description: 'Nombre del producto' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Descripción del producto' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Precio de costo' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  precioCosto?: number;

  @ApiPropertyOptional({ description: 'Precio de venta' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  precioVenta?: number;

  @ApiPropertyOptional({ description: 'publicId de la unidad de medida' })
  @IsOptional()
  @IsPublicId()
  unidadMedidaId?: string;

  @ApiPropertyOptional({ description: 'publicId de la categoría del producto' })
  @IsOptional()
  @IsPublicId()
  categoriaId?: string;

  @ApiPropertyOptional({ description: 'URL de la foto del producto' })
  @IsString()
  @IsOptional()
  foto?: string;
}
