import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TurnoResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'Turno Matutino' })
  nombre: string;

  @ApiProperty({ example: 'semanal' })
  periodicidad: string;

  @ApiPropertyOptional({ example: '09:00:00' })
  horaEntrada?: string | null;

  @ApiPropertyOptional({ example: '18:00:00' })
  horaSalida?: string | null;

  @ApiPropertyOptional({ example: '14:00:00' })
  horaComidaInicio?: string | null;

  @ApiPropertyOptional({ example: '15:00:00' })
  horaComidaFin?: string | null;

  @ApiProperty({ example: 10 })
  toleranciaMinutos: number;

  @ApiProperty({ example: 'L,M,X,J,V' })
  diasLaborables: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;
}
