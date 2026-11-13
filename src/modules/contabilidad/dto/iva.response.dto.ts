import { ApiProperty } from '@nestjs/swagger';

export class IvaMovimientoDto {
  @ApiProperty({ example: '2026-11-10' })
  fecha: string;

  @ApiProperty({ example: 'POL-202611-0001' })
  folio: string;

  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000001' })
  polizaId: string;

  @ApiProperty({ example: 'Venta VT-20261110-0001' })
  concepto: string;

  @ApiProperty({ example: 'trasladado', enum: ['trasladado', 'acreditable'] })
  tipo: string;

  @ApiProperty({ example: '2102' })
  cuenta: string;

  @ApiProperty({ example: 0 })
  debe: number;

  @ApiProperty({ example: 160 })
  haber: number;

  @ApiProperty({ example: 160 })
  importe: number;
}

export class IvaResponseDto {
  @ApiProperty({ example: '2026-11-01' })
  desde: string;

  @ApiProperty({ example: '2026-11-30' })
  hasta: string;

  @ApiProperty({ example: 1600 })
  trasladado: number;

  @ApiProperty({ example: 900 })
  acreditable: number;

  @ApiProperty({ example: 700 })
  neto: number;

  @ApiProperty({ example: 700 })
  porPagar: number;

  @ApiProperty({ example: 0 })
  saldoFavor: number;

  @ApiProperty({ type: [IvaMovimientoDto] })
  movimientos: IvaMovimientoDto[];
}

export class IvaMesDto {
  @ApiProperty({ example: '2026-01' })
  mes: string;

  @ApiProperty({ example: 1600 })
  trasladado: number;

  @ApiProperty({ example: 900 })
  acreditable: number;

  @ApiProperty({ example: 700 })
  neto: number;

  @ApiProperty({ example: 700 })
  porPagar: number;

  @ApiProperty({ example: 0 })
  saldoFavor: number;
}

export class IvaMensualResponseDto {
  @ApiProperty({ example: 2026 })
  anio: number;

  @ApiProperty({ type: [IvaMesDto] })
  meses: IvaMesDto[];

  @ApiProperty({
    example: {
      trasladado: 16000,
      acreditable: 9000,
      neto: 7000,
      porPagar: 7000,
      saldoFavor: 0,
    },
  })
  totales: {
    trasladado: number;
    acreditable: number;
    neto: number;
    porPagar: number;
    saldoFavor: number;
  };
}
