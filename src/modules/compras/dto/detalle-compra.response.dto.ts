import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompraResponseDto } from './compra.response.dto';
import { ProductoResponseDto } from '../../almacen/dto/producto.response.dto';

export class DetalleCompraResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 10.5 })
  cantidad: number;

  @ApiProperty({ example: 15.99 })
  precioUnitario: number;

  @ApiProperty({ example: 167.9 })
  subtotal: number;

  @ApiPropertyOptional({ type: () => CompraResponseDto })
  compra?: CompraResponseDto;

  @ApiPropertyOptional({ type: () => ProductoResponseDto })
  producto?: ProductoResponseDto;
}
