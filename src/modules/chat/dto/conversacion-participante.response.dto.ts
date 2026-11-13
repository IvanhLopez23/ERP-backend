import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario.response.dto';

export class ConversacionParticipanteResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  ultimaLectura?: Date;

  @ApiPropertyOptional({ type: () => UsuarioResponseDto })
  usuario?: UsuarioResponseDto;
}
