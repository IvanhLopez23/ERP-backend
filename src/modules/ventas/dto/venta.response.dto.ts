import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClienteResponseDto } from './cliente.response.dto';
import { DetalleVentaResponseDto } from './detalle-venta.response.dto';
import { EmpleadoResponseDto } from '../../rh/dto/empleado.response.dto';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario.response.dto';

export class VentaResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'VT-20240101-0001' })
  folio: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaVenta: Date;

  @ApiProperty({ example: 1000 })
  subtotal: number;

  @ApiProperty({ example: 100 })
  descuento: number;

  @ApiProperty({ example: 144 })
  iva: number;

  @ApiProperty({ example: 1044 })
  total: number;

  @ApiProperty({ example: 'pendiente' })
  estatus: string;

  @ApiPropertyOptional({ example: 'Observaciones de la venta' })
  observaciones?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiPropertyOptional({ type: () => ClienteResponseDto })
  cliente?: ClienteResponseDto;

  @ApiPropertyOptional({ type: () => EmpleadoResponseDto })
  vendedor?: EmpleadoResponseDto;

  @ApiPropertyOptional({ type: () => UsuarioResponseDto })
  usuario?: UsuarioResponseDto;

  @ApiPropertyOptional({ type: () => DetalleVentaResponseDto, isArray: true })
  detalles?: DetalleVentaResponseDto[];
}
