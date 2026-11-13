import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateRefaccionDto {
  @ApiProperty({
    description: 'Código único de la refacción',
    example: 'REF-001',
  })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({
    description: 'Nombre de la refacción',
    example: 'Filtro de aceite',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción de la refacción' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'publicId del producto en almacén (opcional)',
  })
  @IsOptional()
  @IsPublicId()
  productoId?: string;

  @ApiPropertyOptional({ description: 'Stock mínimo de alerta', example: 5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockMinimo?: number;
}
