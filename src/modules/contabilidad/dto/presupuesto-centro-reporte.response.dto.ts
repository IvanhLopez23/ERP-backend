import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresupuestoMesDto {
  @ApiProperty({ example: 1 })
  mes: number;

  @ApiProperty({ example: 5000 })
  presupuestoIngresos: number;

  @ApiProperty({ example: 4800 })
  realIngresos: number;

  @ApiProperty({ example: -200 })
  variacionIngresos: number;

  @ApiProperty({ example: 3000 })
  presupuestoGastos: number;

  @ApiProperty({ example: 2800 })
  realGastos: number;

  @ApiProperty({ example: -200 })
  variacionGastos: number;

  @ApiProperty({ example: 2000 })
  presupuestoUtilidad: number;

  @ApiProperty({ example: 2000 })
  realUtilidad: number;

  @ApiProperty({ example: 0 })
  variacionUtilidad: number;
}

export class PresupuestoCentroFilaDto {
  @ApiPropertyOptional({ example: '<uuid>', nullable: true })
  centroCostoId?: string | null;

  @ApiPropertyOptional({ example: 'CC-ADMIN', nullable: true })
  codigo?: string | null;

  @ApiProperty({ example: 'Administración' })
  nombre: string;

  @ApiPropertyOptional({ example: 'centro_costo', nullable: true })
  tipo?: string | null;

  @ApiProperty({ type: [PresupuestoMesDto] })
  meses: PresupuestoMesDto[];

  @ApiProperty({ type: PresupuestoMesDto })
  totales: PresupuestoMesDto;
}

export class PresupuestoCentroReporteResponseDto {
  @ApiProperty({ example: 2026 })
  anio: number;

  @ApiProperty({ type: [PresupuestoCentroFilaDto] })
  centros: PresupuestoCentroFilaDto[];

  @ApiProperty({ type: PresupuestoMesDto })
  totales: PresupuestoMesDto;
}
