import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefaccionResponseDto } from './refaccion.response.dto';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario.response.dto';

export class MovimientoRefaccionResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 10.5 })
  cantidad: number;

  @ApiProperty({ example: 'salida' })
  tipo: string;

  @ApiPropertyOptional({ example: 'Movimiento por mantenimiento' })
  observaciones?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiPropertyOptional({ type: () => RefaccionResponseDto })
  refaccion?: RefaccionResponseDto;

  @ApiPropertyOptional({ type: () => UsuarioResponseDto })
  usuario?: UsuarioResponseDto;
}
