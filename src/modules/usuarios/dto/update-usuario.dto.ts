import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({
    description: 'Nuevo nombre de usuario único',
    example: 'usuario_admin_editado',
  })
  @IsString()
  @IsOptional()
  nombreUsuario?: string;

  @ApiPropertyOptional({
    description: 'Nuevo correo electrónico',
    example: 'admin_editado@correo.com',
  })
  @IsEmail()
  @IsOptional()
  correo?: string;

  @ApiPropertyOptional({
    description: 'Nuevo publicId UUID v7 del rol asignado',
    example: '0199a000-0000-7000-8000-000000000001',
  })
  @IsPublicId()
  @IsOptional()
  rolPublicId?: string;
}
