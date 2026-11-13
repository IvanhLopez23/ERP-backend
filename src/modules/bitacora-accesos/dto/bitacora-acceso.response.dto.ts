import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario.response.dto';

export class BitacoraAccesoResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiPropertyOptional({ example: true })
  acceso?: boolean;

  @ApiPropertyOptional({
    example: 'Acceso denegado por credenciales inválidas',
  })
  descripcion?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiPropertyOptional({ type: () => UsuarioResponseDto })
  usuario?: UsuarioResponseDto;
}
