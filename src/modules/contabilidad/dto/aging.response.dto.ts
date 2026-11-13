import { ApiProperty } from '@nestjs/swagger';

export class AgingBucketDto {
  @ApiProperty({
    example: '1-30',
    enum: ['corriente', '1-30', '31-60', '61-90', '>90'],
  })
  rango: string;

  @ApiProperty({ example: 1500 })
  monto: number;

  @ApiProperty({ example: 2 })
  registros: number;
}

export class AgingCarteraDto {
  @ApiProperty({ example: 5000 })
  total: number;

  @ApiProperty({ type: [AgingBucketDto] })
  buckets: AgingBucketDto[];
}

export class AgingResponseDto {
  @ApiProperty({ example: '2026-11-10' })
  fechaCorte: string;

  @ApiProperty({ type: AgingCarteraDto })
  cxc: AgingCarteraDto;

  @ApiProperty({ type: AgingCarteraDto })
  cxp: AgingCarteraDto;
}
