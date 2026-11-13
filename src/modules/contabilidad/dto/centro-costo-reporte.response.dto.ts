import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CentroCostoResponseDto } from './centro-costo.response.dto';

export class CentroCostoReporteFilaDto {
  @ApiPropertyOptional({ example: '<uuid>', nullable: true })
  centroCostoId?: string | null;

  @ApiPropertyOptional({ example: 'CC-ADMIN', nullable: true })
  codigo?: string | null;

  @ApiProperty({ example: 'Administración' })
  nombre: string;

  @ApiPropertyOptional({ example: 'centro_costo', nullable: true })
  tipo?: string | null;

  @ApiProperty({ example: 15000 })
  ingresos: number;

  @ApiProperty({ example: 9000 })
  gastos: number;

  @ApiProperty({ example: 6000 })
  utilidad: number;

  @ApiProperty({ example: 12 })
  movimientos: number;
}

export class CentroCostoReporteResponseDto {
  @ApiProperty({ example: '2026-11-01' })
  desde: string;

  @ApiProperty({ example: '2026-11-30' })
  hasta: string;

  @ApiProperty({ type: [CentroCostoReporteFilaDto] })
  centros: CentroCostoReporteFilaDto[];

  @ApiProperty({
    example: { ingresos: 15000, gastos: 9000, utilidad: 6000 },
  })
  totales: { ingresos: number; gastos: number; utilidad: number };
}

export class CentroCostoMovimientoDto {
  @ApiProperty({ example: '2026-11-10' })
  fecha: string;

  @ApiProperty({ example: 'POL-202611-0001' })
  folio: string;

  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000002' })
  polizaId: string;

  @ApiProperty({ example: 'Venta' })
  concepto: string;

  @ApiProperty({ example: '4101' })
  cuenta: string;

  @ApiProperty({ example: 'Ventas' })
  cuentaNombre: string;

  @ApiProperty({ example: 'ingreso' })
  tipo: string;

  @ApiProperty({ example: 0 })
  debe: number;

  @ApiProperty({ example: 1000 })
  haber: number;

  @ApiProperty({ example: 1000 })
  importe: number;
}

export class CentroCostoDetalleResponseDto {
  @ApiProperty({ example: '2026-11-01' })
  desde: string;

  @ApiProperty({ example: '2026-11-30' })
  hasta: string;

  @ApiProperty({ type: CentroCostoResponseDto })
  centro: CentroCostoResponseDto;

  @ApiProperty({ type: [CentroCostoMovimientoDto] })
  movimientos: CentroCostoMovimientoDto[];

  @ApiProperty({
    example: { ingresos: 15000, gastos: 9000, utilidad: 6000 },
  })
  totales: { ingresos: number; gastos: number; utilidad: number };
}
