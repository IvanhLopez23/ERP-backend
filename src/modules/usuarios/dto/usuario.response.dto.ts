import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleResponseDto } from '../../roles/dto/role.response.dto';
import { PerfilResponseDto } from './perfil.response.dto';

export class UsuarioResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'juan.perez' })
  nombreUsuario: string;

  @ApiProperty({ example: 'juan@example.com' })
  correo: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiPropertyOptional({ type: () => RoleResponseDto })
  rol?: RoleResponseDto;

  @ApiPropertyOptional({ type: () => PerfilResponseDto })
  perfil?: PerfilResponseDto;
}
