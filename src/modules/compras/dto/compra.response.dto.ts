import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProveedorResponseDto } from './proveedor.response.dto';
import { DetalleCompraResponseDto } from './detalle-compra.response.dto';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario.response.dto';
import { AlmacenResponseDto } from '../../almacen/dto/almacen.response.dto';

export class CompraResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'CMP-20240101-0001' })
  folio: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCompra: Date;

  @ApiProperty({ example: 1000 })
  subtotal: number;

  @ApiProperty({ example: 160 })
  iva: number;

  @ApiProperty({ example: 1160 })
  total: number;

  @ApiProperty({ example: 'pendiente' })
  estatus: string;

  @ApiPropertyOptional({ example: 'Observaciones de la compra' })
  observaciones?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiPropertyOptional({ type: () => ProveedorResponseDto })
  proveedor?: ProveedorResponseDto;

  @ApiPropertyOptional({ type: () => AlmacenResponseDto })
  almacen?: AlmacenResponseDto | null;

  @ApiPropertyOptional({ type: () => UsuarioResponseDto })
  usuario?: UsuarioResponseDto;

  @ApiPropertyOptional({ type: () => DetalleCompraResponseDto, isArray: true })
  detalles?: DetalleCompraResponseDto[];
}
