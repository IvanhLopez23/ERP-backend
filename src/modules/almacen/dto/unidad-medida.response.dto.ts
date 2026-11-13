import { ApiProperty } from '@nestjs/swagger';

export class UnidadMedidaResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'Pieza' })
  nombre: string;

  @ApiProperty({ example: 'pza' })
  abreviatura: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;
}
