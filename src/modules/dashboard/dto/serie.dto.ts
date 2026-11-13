import { ApiProperty } from '@nestjs/swagger';

export class SerieDto {
  @ApiProperty({
    description: 'Nombre de la serie',
    example: 'Ingresos',
  })
  nombre: string;

  @ApiProperty({
    description: 'Valores alineados con "labels" de la gráfica',
    type: [Number],
    example: [12000, 15000, 9800],
  })
  datos: number[];
}
