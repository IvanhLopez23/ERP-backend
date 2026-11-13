import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlmacenResponseDto } from './almacen.response.dto';

export class OrdenSalidaDetalleResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'PROD-001' })
  codigo: string;

  @ApiProperty({ example: 'Producto demo' })
  nombre: string;

  @ApiPropertyOptional({ example: 'Pieza' })
  unidadMedida?: string | null;

  @ApiProperty({ example: 5 })
  cantidad: number;

  @ApiProperty({ example: 20 })
  existenciaAnterior: number;

  @ApiProperty({ example: 15 })
  existenciaNueva: number;
}

export class OrdenSalidaResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'SAL-20261113-0001' })
  folio: string;

  @ApiProperty({ example: '2026-11-13T00:00:00.000Z' })
  fechaSalida: Date;

  @ApiProperty({ example: 'Salida a producción' })
  motivo: string;

  @ApiPropertyOptional({ example: 'Entrega parcial' })
  observaciones?: string | null;

  @ApiProperty({ example: 2 })
  totalProductos: number;

  @ApiProperty({ example: 10 })
  totalUnidades: number;

  @ApiProperty({ example: 'aplicada' })
  estatus: string;

  @ApiProperty({ example: '2026-11-13T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiPropertyOptional({ type: () => AlmacenResponseDto })
  almacen?: AlmacenResponseDto;

  @ApiPropertyOptional({ type: () => [OrdenSalidaDetalleResponseDto] })
  detalles?: OrdenSalidaDetalleResponseDto[];
}
