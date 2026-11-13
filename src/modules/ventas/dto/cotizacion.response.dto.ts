import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClienteResponseDto } from './cliente.response.dto';
import { DetalleCotizacionResponseDto } from './detalle-cotizacion.response.dto';
import { EmpleadoResponseDto } from '../../rh/dto/empleado.response.dto';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario.response.dto';

export class CotizacionResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'COT-20240101-0001' })
  folio: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fecha: Date;

  @ApiProperty({ example: 30 })
  diasValidez: number;

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

  @ApiPropertyOptional({ example: 'Observaciones de la cotización' })
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

  @ApiPropertyOptional({
    type: () => DetalleCotizacionResponseDto,
    isArray: true,
  })
  detalles?: DetalleCotizacionResponseDto[];
}
