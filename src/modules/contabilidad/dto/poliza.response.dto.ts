import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PeriodoContableResponseDto } from './periodo-contable.response.dto';
import { PolizaDetalleResponseDto } from './poliza-detalle.response.dto';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario.response.dto';

export class PolizaResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'POL-202611-0001' })
  folio: string;

  @ApiProperty({ example: '2026-11-10' })
  fecha: string;

  @ApiProperty({ example: 'diario' })
  tipo: string;

  @ApiProperty({ example: 'Aporte de capital' })
  concepto: string;

  @ApiProperty({ example: 'borrador' })
  estatus: string;

  @ApiProperty({ example: 1000 })
  totalDebe: number;

  @ApiProperty({ example: 1000 })
  totalHaber: number;

  @ApiPropertyOptional({ type: () => PeriodoContableResponseDto })
  periodo?: PeriodoContableResponseDto;

  @ApiPropertyOptional({ type: () => UsuarioResponseDto })
  usuario?: UsuarioResponseDto;

  @ApiPropertyOptional({ type: () => [PolizaDetalleResponseDto] })
  detalles?: PolizaDetalleResponseDto[];
}
