import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario.response.dto';

export class BitacoraAccionResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'GET' })
  metodo: string;

  @ApiProperty({ example: '/api/productos' })
  endpoint: string;

  @ApiPropertyOptional({ example: {} })
  parametros?: Record<string, unknown>;

  @ApiPropertyOptional({ example: {} })
  body?: unknown;

  @ApiPropertyOptional({ example: {} })
  respuesta?: unknown;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 12 })
  duracionMs: number;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  ip?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 ...' })
  userAgent?: string;

  @ApiProperty({ example: true })
  exitoso: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiPropertyOptional({ type: () => UsuarioResponseDto })
  usuario?: UsuarioResponseDto;
}
