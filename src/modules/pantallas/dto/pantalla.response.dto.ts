import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PantallaResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'Productos' })
  nombre: string;

  @ApiProperty({ example: '/productos' })
  ruta: string;

  @ApiProperty({ example: 'shopping-cart' })
  icono: string;

  @ApiProperty({ example: 0 })
  orden: number;

  @ApiPropertyOptional({ example: 'Inventario' })
  subMenu?: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiPropertyOptional({ example: 'Almacén' })
  modulo?: string;
}
