import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClienteResponseDto } from '../../ventas/dto/cliente.response.dto';
import { VentaResponseDto } from '../../ventas/dto/venta.response.dto';
import { PolizaResponseDto } from './poliza.response.dto';
import { CobroCxCResponseDto } from './cobro-cxc.response.dto';

export class CuentaPorCobrarResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'CXC-VT-202611-0001' })
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

  @ApiPropertyOptional({ type: () => ClienteResponseDto })
  cliente?: ClienteResponseDto;

  @ApiPropertyOptional({ type: () => VentaResponseDto })
  venta?: VentaResponseDto;

  @ApiPropertyOptional({ type: () => PolizaResponseDto })
  poliza?: PolizaResponseDto;

  @ApiPropertyOptional({ type: () => [CobroCxCResponseDto] })
  cobros?: CobroCxCResponseDto[];
}
