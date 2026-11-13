import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlmacenResponseDto } from './almacen.response.dto';

export class CorteInventarioDetalleResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'PROD-001' })
  codigo: string;

  @ApiProperty({ example: 'Caja de tornillos' })
  nombre: string;

  @ApiPropertyOptional({ example: 'Ferretería' })
  categoria?: string | null;

  @ApiPropertyOptional({ example: 'Pieza' })
  unidadMedida?: string | null;

  @ApiProperty({ example: 120 })
  existencia: number;

  @ApiProperty({ example: 15.5 })
  precioCosto: number;

  @ApiProperty({ example: 25 })
  precioVenta: number;

  @ApiProperty({ example: 1860 })
  valorCosto: number;

  @ApiProperty({ example: 3000 })
  valorVenta: number;
}

export class CorteInventarioResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 2026 })
  anio: number;

  @ApiProperty({ example: 11 })
  mes: number;

  @ApiProperty({ example: '2026-11-30T18:00:00.000Z' })
  fechaCorte: Date;

  @ApiProperty({ example: 45 })
  totalProductos: number;

  @ApiProperty({ example: 1250 })
  totalUnidades: number;

  @ApiProperty({ example: 55000 })
  totalValorCosto: number;

  @ApiProperty({ example: 82000 })
  totalValorVenta: number;

  @ApiPropertyOptional({ type: () => AlmacenResponseDto })
  almacen?: AlmacenResponseDto;

  @ApiPropertyOptional({ type: () => [CorteInventarioDetalleResponseDto] })
  detalles?: CorteInventarioDetalleResponseDto[];
}
