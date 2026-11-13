import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VentaResponseDto } from './venta.response.dto';
import { ProductoResponseDto } from '../../almacen/dto/producto.response.dto';

export class DetalleVentaResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 5 })
  cantidad: number;

  @ApiProperty({ example: 15.99 })
  precioUnitario: number;

  @ApiProperty({ example: 10 })
  descuento: number;

  @ApiProperty({ example: 71.96 })
  subtotal: number;

  @ApiPropertyOptional({ type: () => VentaResponseDto })
  venta?: VentaResponseDto;

  @ApiPropertyOptional({ type: () => ProductoResponseDto })
  producto?: ProductoResponseDto;
}
