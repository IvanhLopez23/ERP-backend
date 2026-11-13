import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartamentoResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'Recursos Humanos' })
  nombre: string;

  @ApiPropertyOptional({ example: 'Departamento encargado del personal' })
  descripcion?: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;
}
