import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BackfillDto {
  @ApiPropertyOptional({
    description:
      'Crear automáticamente los periodos contables faltantes para las fechas de las ventas/compras',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  crearPeriodos?: boolean;
}
