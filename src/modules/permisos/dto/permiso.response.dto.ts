import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PantallaResponseDto } from '../../pantallas/dto/pantalla.response.dto';
import { RoleResponseDto } from '../../roles/dto/role.response.dto';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario.response.dto';

export class PermisoResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: true })
  ver: boolean;

  @ApiProperty({ example: true })
  crear: boolean;

  @ApiProperty({ example: true })
  editar: boolean;

  @ApiProperty({ example: true })
  eliminar: boolean;

  @ApiProperty({ example: true })
  adjuntos: boolean;

  @ApiProperty({ example: true })
  reportes: boolean;

  @ApiPropertyOptional({ type: () => PantallaResponseDto })
  pantalla?: PantallaResponseDto;

  @ApiPropertyOptional({ type: () => UsuarioResponseDto })
  usuario?: UsuarioResponseDto;

  @ApiPropertyOptional({ type: () => RoleResponseDto })
  rol?: RoleResponseDto;
}
