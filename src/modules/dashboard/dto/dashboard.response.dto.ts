import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { KpiDto } from './kpi.dto';
import { GraficaDto } from './grafica.dto';
import { SerieDto } from './serie.dto';

@ApiExtraModels(KpiDto, GraficaDto, SerieDto)
export class DashboardResponseDto {
  @ApiProperty({
    description: 'Indicadores del módulo',
    type: [KpiDto],
  })
  kpis: KpiDto[];

  @ApiProperty({
    description: 'Gráficas del módulo listas para graficar (labels + series)',
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(GraficaDto) },
    example: {
      ingresosPorMes: {
        tipo: 'area',
        labels: ['oct 25', 'nov 25'],
        series: [{ nombre: 'Ingresos', datos: [12000, 15000] }],
      },
    },
  })
  graficas: Record<string, GraficaDto>;
}
