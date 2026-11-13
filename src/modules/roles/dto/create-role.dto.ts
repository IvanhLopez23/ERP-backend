import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Nombre o descripción detallada del rol',
    example: 'Administrador',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional({
    description: 'Indica si el rol tiene acceso total al sistema',
  })
  @IsBoolean()
  @IsOptional()
  esAdministrador?: boolean;
}
