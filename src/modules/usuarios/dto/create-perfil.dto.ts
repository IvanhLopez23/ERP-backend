import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePerfilDto {
  @ApiProperty({
    description: 'Nombre de pila del usuario',
    example: 'Juan',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    description: 'Apellido paterno del usuario',
    example: 'Pérez',
  })
  @IsString()
  @IsNotEmpty()
  apellidoPaterno: string;

  @ApiProperty({
    description: 'Apellido materno del usuario',
    example: 'Gómez',
  })
  @IsString()
  @IsNotEmpty()
  apellidoMaterno: string;

  @ApiPropertyOptional({
    description: 'Género del usuario',
    example: 'M',
  })
  @IsString()
  @IsOptional()
  genero?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento',
    example: '1990-05-15',
    type: String,
    format: 'date',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  fechaNacimiento?: Date;

  @ApiPropertyOptional({
    description: 'URL o ruta de la foto de perfil',
    example: 'uploads/perfil-juan.jpg',
  })
  @IsString()
  @IsOptional()
  foto?: string;
}
