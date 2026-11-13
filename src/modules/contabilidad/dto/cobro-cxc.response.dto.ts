import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PolizaResponseDto } from './poliza.response.dto';

export class CobroCxCResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: '2026-11-15' })
  fecha: string;

  @ApiProperty({ example: 500 })
  monto: number;

  @ApiProperty({ example: 'transferencia' })
  metodoPago: string;

  @ApiPropertyOptional({ example: 'SPEI-123' })
  referencia?: string;

  @ApiPropertyOptional()
  observaciones?: string;

  @ApiPropertyOptional({ type: () => PolizaResponseDto })
  poliza?: PolizaResponseDto;
}
