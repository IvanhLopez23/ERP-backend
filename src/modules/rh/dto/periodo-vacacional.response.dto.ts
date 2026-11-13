import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmpleadoResponseDto } from './empleado.response.dto';

export class PeriodoVacacionalResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaInicio: Date;

  @ApiProperty({ example: '2024-12-31T00:00:00.000Z' })
  fechaFin: Date;

  @ApiProperty({ example: '2024-06-30T00:00:00.000Z' })
  fechaLimiteDisfrute: Date;

  @ApiPropertyOptional({
    example: 'Periodo vacacional 2024-2025',
    description: 'Descripción legible del periodo vacacional',
  })
  descripcion?: string | null;

  @ApiProperty({ example: 1 })
  antiguedadAnios: number;

  @ApiProperty({ example: 12 })
  diasOtorgados: number;

  @ApiProperty({ example: 0 })
  diasUsados: number;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiProperty({ type: () => EmpleadoResponseDto })
  empleado: EmpleadoResponseDto;
}
