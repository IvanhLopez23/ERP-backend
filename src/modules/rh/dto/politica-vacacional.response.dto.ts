import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PoliticaVacacionalResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 1 })
  aniosDesde: number;

  @ApiPropertyOptional({ example: 5 })
  aniosHasta?: number;

  @ApiProperty({ example: 12 })
  diasOtorgados: number;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;
}
