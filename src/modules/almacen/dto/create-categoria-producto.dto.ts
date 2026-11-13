import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateCategoriaProductoDto {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Electrónicos',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción de la categoría',
    example: 'Productos electrónicos y de cómputo',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'publicId de la categoría padre (para subcategorías)',
    example: null,
  })
  @IsOptional()
  @IsPublicId()
  padreId?: string;
}
