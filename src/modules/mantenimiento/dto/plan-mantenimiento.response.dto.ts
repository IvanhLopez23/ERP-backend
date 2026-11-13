import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipoResponseDto } from './equipo.response.dto';

export class PlanMantenimientoResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'Cambio de aceite y filtros' })
  descripcion: string;

  @ApiProperty({ example: 'preventivo' })
  tipo: string;

  @ApiProperty({ example: 'mensual' })
  periodicidad: string;

  @ApiProperty({ example: 1 })
  intervalo: number;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  fechaUltimoEjecucion?: Date;

  @ApiPropertyOptional({ example: '2024-02-01T00:00:00.000Z' })
  fechaProximaEjecucion?: Date;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiPropertyOptional({ type: () => EquipoResponseDto })
  equipo?: EquipoResponseDto;
}
