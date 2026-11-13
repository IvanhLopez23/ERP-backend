import { ApiProperty } from '@nestjs/swagger';
import { SerieDto } from './serie.dto';

export type TipoGrafica =
  | 'linea'
  | 'area'
  | 'barras'
  | 'barras-horizontales'
  | 'barras-apiladas'
  | 'dona'
  | 'tabla';

export const TIPOS_GRAFICA: TipoGrafica[] = [
  'linea',
  'area',
  'barras',
  'barras-horizontales',
  'barras-apiladas',
  'dona',
  'tabla',
];

export class GraficaDto {
  @ApiProperty({
    description: 'Tipo de gráfica sugerido para el frontend',
    enum: TIPOS_GRAFICA,
    example: 'area',
  })
  tipo: TipoGrafica;

  @ApiProperty({
    description: 'Etiquetas del eje X (o categorías)',
    type: [String],
    example: ['oct 25', 'nov 25', 'dic 25'],
  })
  labels: string[];

  @ApiProperty({
    description: 'Series de datos alineadas con "labels"',
    type: [SerieDto],
  })
  series: SerieDto[];
}
