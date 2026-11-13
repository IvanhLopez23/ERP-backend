import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefaccionResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'REF-001' })
  codigo: string;

  @ApiProperty({ example: 'Rodamiento 6205' })
  nombre: string;

  @ApiPropertyOptional({ example: 'Rodamiento de bolas de una hilera' })
  descripcion?: string;

  @ApiProperty({ example: 5 })
  stockMinimo: number;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;
}
