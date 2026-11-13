import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AlmacenResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'Almacén Principal' })
  nombre: string;

  @ApiPropertyOptional({ example: 'Av. Principal #123, Col. Centro' })
  ubicacion?: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;
}
