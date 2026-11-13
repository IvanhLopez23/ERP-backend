import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAlmacenDto {
  @ApiProperty({
    description: 'Nombre del almacén',
    example: 'Almacén Principal',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({
    description: 'Ubicación del almacén',
    example: 'Av. Principal #123, Col. Centro',
  })
  @IsString()
  @IsOptional()
  ubicacion?: string;
}
