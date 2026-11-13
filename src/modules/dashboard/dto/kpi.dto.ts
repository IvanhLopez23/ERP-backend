import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class KpiDto {
  @ApiProperty({
    description: 'Clave estable del KPI',
    example: 'ventasMes',
  })
  clave: string;

  @ApiProperty({
    description: 'Etiqueta legible del KPI',
    example: 'Ventas del mes',
  })
  etiqueta: string;

  @ApiProperty({
    description: 'Valor del KPI',
    example: 125000.5,
  })
  valor: number | string;

  @ApiPropertyOptional({
    description: 'Unidad del valor (moneda, %, días, etc.)',
    example: 'MXN',
  })
  unidad?: string;

  @ApiPropertyOptional({
    description: 'Variación porcentual contra el período anterior',
    example: 8.4,
  })
  variacion?: number;
}
