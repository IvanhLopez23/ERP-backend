import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProveedorResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'PROV-001' })
  codigo: string;

  @ApiProperty({ example: 'Proveedor de ejemplo' })
  nombre: string;

  @ApiPropertyOptional({ example: 'XAXX010101000' })
  rfc?: string;

  @ApiPropertyOptional({ example: 'Av. Principal #123, Col. Centro' })
  direccion?: string;

  @ApiPropertyOptional({ example: '5551234567' })
  telefono?: string;

  @ApiPropertyOptional({ example: 'proveedor@example.com' })
  correo?: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;
}
