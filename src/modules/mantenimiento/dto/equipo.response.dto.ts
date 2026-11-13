import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanMantenimientoResponseDto } from './plan-mantenimiento.response.dto';

export class EquipoResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'EQ-001' })
  codigo: string;

  @ApiProperty({ example: 'Torno CNC' })
  nombre: string;

  @ApiPropertyOptional({ example: 'Torno de control numérico' })
  descripcion?: string;

  @ApiPropertyOptional({ example: 'Planta 1 - Nave B' })
  ubicacion?: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  fechaAdquisicion?: Date;

  @ApiProperty({ example: 'operativo' })
  estado: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiPropertyOptional({
    type: () => PlanMantenimientoResponseDto,
    isArray: true,
  })
  planes?: PlanMantenimientoResponseDto[];
}
