import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePerfilDto } from './create-perfil.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateUsuarioDto {
  @ApiProperty({
    description: 'Nombre de usuario único para la cuenta',
    example: 'usuario_admin',
  })
  @IsString()
  @IsNotEmpty()
  nombreUsuario: string;

  @ApiProperty({
    description: 'Correo electrónico único del usuario',
    example: 'admin@correo.com',
  })
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @ApiProperty({
    description: 'Contraseña de la cuenta (será encriptada)',
    example: 'ClaveSegura123',
  })
  @IsString()
  @IsNotEmpty()
  contrasena: string;

  @ApiProperty({
    description: 'Identificador público UUID v7 del rol asignado',
    example: '0199a000-0000-7000-8000-000000000001',
  })
  @IsPublicId()
  @IsNotEmpty()
  rolPublicId: string;

  @ApiPropertyOptional({
    description: 'Datos del perfil asociados al usuario',
    type: CreatePerfilDto,
  })
  @ValidateNested()
  @Type(() => CreatePerfilDto)
  @IsOptional()
  perfil?: CreatePerfilDto;
}
