import { PartialType } from '@nestjs/swagger';
import { CreateCategoriaProductoDto } from './create-categoria-producto.dto';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class UpdateCategoriaProductoDto extends PartialType(
  CreateCategoriaProductoDto,
) {
  @ApiPropertyOptional({
    description: 'Nombre de la categoría',
    example: 'Electrónicos y Cómputo',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción de la categoría',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'publicId de la categoría padre',
  })
  @IsOptional()
  @IsPublicId()
  padreId?: string;
}
