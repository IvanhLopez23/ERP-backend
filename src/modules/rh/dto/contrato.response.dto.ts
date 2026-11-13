import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmpleadoResponseDto } from './empleado.response.dto';

export class ContratoResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'indefinido' })
  tipo: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaInicio: Date;

  @ApiPropertyOptional({ example: '2024-12-31T00:00:00.000Z' })
  fechaFin?: Date;

  @ApiProperty({ example: 25000 })
  salario: number;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiPropertyOptional({ type: () => EmpleadoResponseDto })
  empleado?: EmpleadoResponseDto;
}
