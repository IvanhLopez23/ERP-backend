import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnidadMedidaResponseDto } from './unidad-medida.response.dto';
import { CategoriaProductoResponseDto } from './categoria-producto.response.dto';

export class ProductoResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'PROD-001' })
  codigo: string;

  @ApiProperty({ example: 'Producto de ejemplo' })
  nombre: string;

  @ApiProperty({ example: 'Descripción del producto' })
  descripcion: string;

  @ApiProperty({ example: 10.5 })
  precioCosto: number;

  @ApiProperty({ example: 15.99 })
  precioVenta: number;

  @ApiProperty({ example: 'foto.png' })
  foto: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiPropertyOptional({ type: () => UnidadMedidaResponseDto })
  unidadMedida?: UnidadMedidaResponseDto;

  @ApiPropertyOptional({ type: () => CategoriaProductoResponseDto })
  categoria?: CategoriaProductoResponseDto;
}
