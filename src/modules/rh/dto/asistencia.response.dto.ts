import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmpleadoResponseDto } from './empleado.response.dto';
import { TurnoResponseDto } from './turno.response.dto';

export class AsistenciaResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fecha: Date;

  @ApiPropertyOptional({ example: '08:00:00' })
  horaEntrada?: string;

  @ApiPropertyOptional({ example: '17:00:00' })
  horaSalida?: string;

  @ApiProperty({ example: 'presente' })
  estatus: string;

  @ApiProperty({ example: 15, description: 'Minutos de retardo' })
  retardoMinutos: number;

  @ApiProperty({ example: 30, description: 'Minutos de salida anticipada' })
  salidaAnticipadaMinutos: number;

  @ApiPropertyOptional({ example: 8.5, description: 'Horas trabajadas' })
  horasTrabajadas?: number | null;

  @ApiPropertyOptional({ example: 'Registro de asistencia' })
  observaciones?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiPropertyOptional({ type: () => EmpleadoResponseDto })
  empleado?: EmpleadoResponseDto;

  @ApiPropertyOptional({ type: () => TurnoResponseDto })
  turno?: TurnoResponseDto | null;
}
