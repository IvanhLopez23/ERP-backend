import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversacionParticipanteResponseDto } from './conversacion-participante.response.dto';
import { MensajeResponseDto } from './mensaje.response.dto';

export class ConversacionResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: false })
  esGrupo: boolean;

  @ApiPropertyOptional({ example: 'Grupo de trabajo' })
  nombre?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiPropertyOptional({
    type: () => ConversacionParticipanteResponseDto,
    isArray: true,
  })
  participantes?: ConversacionParticipanteResponseDto[];

  @ApiPropertyOptional({ type: () => MensajeResponseDto, isArray: true })
  mensajes?: MensajeResponseDto[];
}
