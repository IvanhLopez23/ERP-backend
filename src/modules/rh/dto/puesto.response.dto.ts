import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DepartamentoResponseDto } from './departamento.response.dto';

export class PuestoResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'Analista de Sistemas' })
  nombre: string;

  @ApiPropertyOptional({ example: 'Responsable del soporte de sistemas' })
  descripcion?: string;

  @ApiProperty({ example: 15000 })
  salarioMinimo: number;

  @ApiProperty({ example: 25000 })
  salarioMaximo: number;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiPropertyOptional({ type: () => DepartamentoResponseDto })
  departamento?: DepartamentoResponseDto;
}
