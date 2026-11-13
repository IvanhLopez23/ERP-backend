import { PartialType } from '@nestjs/swagger';
import { CreateRefaccionDto } from './create-refaccion.dto';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class UpdateRefaccionDto extends PartialType(CreateRefaccionDto) {
  @ApiPropertyOptional({ description: 'Código único de la refacción' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiPropertyOptional({ description: 'Nombre de la refacción' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción de la refacción' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'publicId del producto en almacén' })
  @IsOptional()
  @IsPublicId()
  productoId?: string;

  @ApiPropertyOptional({ description: 'Stock mínimo de alerta' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockMinimo?: number;
}
