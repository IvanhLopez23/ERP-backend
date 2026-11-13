import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NominaEmpleadoPreviewDto {
  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000001' })
  publicId: string;

  @ApiProperty({ example: 'EMP-001' })
  codigo: string;

  @ApiProperty({ example: 'Juan Pérez' })
  nombre: string;

  @ApiPropertyOptional({ example: 'CC-ADMIN', nullable: true })
  centroCosto?: string | null;

  @ApiProperty({ example: 25000 })
  salarioBase: number;

  @ApiProperty({ example: 25000 })
  percepciones: number;

  @ApiProperty({ example: 0 })
  isr: number;

  @ApiProperty({ example: 0 })
  imss: number;

  @ApiProperty({ example: 0 })
  otrasDeducciones: number;

  @ApiProperty({ example: 25000 })
  neto: number;
}

export class NominaTotalesDto {
  @ApiProperty({ example: 100000 })
  percepciones: number;

  @ApiProperty({ example: 12000 })
  isr: number;

  @ApiProperty({ example: 4000 })
  imss: number;

  @ApiProperty({ example: 0 })
  otrasDeducciones: number;

  @ApiProperty({ example: 84000 })
  neto: number;

  @ApiProperty({ example: 5000 })
  imssPatronal: number;

  @ApiProperty({ example: 3000 })
  provisionPrestaciones: number;
}

export class NominaPreviewResponseDto {
  @ApiProperty({ example: 2026 })
  anio: number;

  @ApiProperty({ example: 11 })
  mes: number;

  @ApiProperty({ type: [NominaEmpleadoPreviewDto] })
  empleados: NominaEmpleadoPreviewDto[];

  @ApiProperty({ type: NominaTotalesDto })
  totales: NominaTotalesDto;
}

export class NominaDetalleResponseDto {
  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000002' })
  publicId: string;

  @ApiProperty({ example: 'EMP-001' })
  codigo: string;

  @ApiProperty({ example: 'Juan Pérez' })
  nombre: string;

  @ApiPropertyOptional({ example: 'CC-ADMIN', nullable: true })
  centroCosto?: string | null;

  @ApiProperty({ example: 25000 })
  salarioBase: number;

  @ApiProperty({ example: 25000 })
  percepciones: number;

  @ApiProperty({ example: 2500 })
  isr: number;

  @ApiProperty({ example: 800 })
  imss: number;

  @ApiProperty({ example: 0 })
  otrasDeducciones: number;

  @ApiProperty({ example: 21700 })
  neto: number;
}

export class NominaPorCentroDto {
  @ApiPropertyOptional({ example: 'CC-ADMIN', nullable: true })
  codigo?: string | null;

  @ApiProperty({ example: 'Administración' })
  nombre: string;

  @ApiProperty({ example: 50000 })
  percepciones: number;

  @ApiProperty({ example: 5000 })
  isr: number;

  @ApiProperty({ example: 1600 })
  imss: number;

  @ApiProperty({ example: 43400 })
  neto: number;

  @ApiProperty({ example: 2 })
  empleados: number;
}

export class NominaResponseDto {
  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000003' })
  publicId: string;

  @ApiProperty({ example: 2026 })
  anio: number;

  @ApiProperty({ example: 11 })
  mes: number;

  @ApiProperty({ example: '2026-11-30' })
  fecha: string;

  @ApiProperty({ example: 'contabilizada' })
  estatus: string;

  @ApiProperty({ example: 100000 })
  totalPercepciones: number;

  @ApiProperty({ example: 12000 })
  totalIsr: number;

  @ApiProperty({ example: 4000 })
  totalImss: number;

  @ApiProperty({ example: 0 })
  totalOtrasDeducciones: number;

  @ApiProperty({ example: 84000 })
  totalNeto: number;

  @ApiProperty({ example: 5000 })
  imssPatronal: number;

  @ApiProperty({ example: 3000 })
  provisionPrestaciones: number;

  @ApiPropertyOptional({
    example: { publicId: '<uuid>', folio: 'POL-202611-0001' },
    nullable: true,
  })
  poliza?: { publicId: string; folio: string } | null;

  @ApiProperty({ type: [NominaDetalleResponseDto] })
  detalles: NominaDetalleResponseDto[];

  @ApiProperty({ type: [NominaPorCentroDto] })
  porCentro: NominaPorCentroDto[];
}
