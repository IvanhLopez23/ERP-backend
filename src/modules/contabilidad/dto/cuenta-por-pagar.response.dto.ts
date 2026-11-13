import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProveedorResponseDto } from '../../compras/dto/proveedor.response.dto';
import { CompraResponseDto } from '../../compras/dto/compra.response.dto';
import { PolizaResponseDto } from './poliza.response.dto';
import { PagoCxPResponseDto } from './pago-cxp.response.dto';

export class CuentaPorPagarResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'CXP-DEV-CMP-0001' })
  folio: string;

  @ApiProperty({ example: '2026-11-10' })
  fechaEmision: string;

  @ApiProperty({ example: '2026-12-10' })
  fechaVencimiento: string;

  @ApiProperty({ example: 1160 })
  monto: number;

  @ApiProperty({ example: 660 })
  saldo: number;

  @ApiProperty({ example: 'parcial' })
  estatus: string;

  @ApiPropertyOptional()
  observaciones?: string;

  @ApiPropertyOptional({ type: () => ProveedorResponseDto })
  proveedor?: ProveedorResponseDto;

  @ApiPropertyOptional({ type: () => CompraResponseDto })
  compra?: CompraResponseDto;

  @ApiPropertyOptional({ type: () => PolizaResponseDto })
  poliza?: PolizaResponseDto;

  @ApiPropertyOptional({ type: () => [PagoCxPResponseDto] })
  pagos?: PagoCxPResponseDto[];
}
