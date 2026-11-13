import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeclaracionIvaResponseDto {
  @ApiProperty({ example: '0199a000-0000-7000-8000-000000000001' })
  publicId: string;

  @ApiProperty({ example: 2026 })
  anio: number;

  @ApiProperty({ example: 11 })
  mes: number;

  @ApiProperty({ example: '2026-12-17' })
  fecha: string;

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

  @ApiProperty({ example: 'pagada', enum: ['pagada', 'declarada'] })
  estatus: string;

  @ApiPropertyOptional({
    example: { publicId: '<uuid>', folio: 'POL-202612-0001' },
    nullable: true,
  })
  poliza?: { publicId: string; folio: string } | null;

  @ApiProperty({ example: '2026-12-17T10:00:00.000Z' })
  fechaCreacion: Date;
}
