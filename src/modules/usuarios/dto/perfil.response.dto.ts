import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PerfilResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'Juan' })
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  apellidoPaterno: string;

  @ApiProperty({ example: 'García' })
  apellidoMaterno: string;

  @ApiPropertyOptional({ example: 'M' })
  genero?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  fechaNacimiento?: Date;

  @ApiPropertyOptional({ example: 'foto.png' })
  foto?: string;
}
