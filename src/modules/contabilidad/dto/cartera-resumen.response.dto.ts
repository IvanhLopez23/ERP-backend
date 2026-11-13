import { ApiProperty } from '@nestjs/swagger';

class ResumenCarteraDto {
  @ApiProperty({ example: 15000 })
  total: number;

  @ApiProperty({ example: 5000 })
  vencido: number;

  @ApiProperty({ example: 3 })
  registros: number;
}

export class CarteraResumenResponseDto {
  @ApiProperty({ type: ResumenCarteraDto })
  cxc: ResumenCarteraDto;

  @ApiProperty({ type: ResumenCarteraDto })
  cxp: ResumenCarteraDto;
}
