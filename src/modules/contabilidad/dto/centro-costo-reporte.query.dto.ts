import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReporteContableQueryDto } from './reporte-contable.query.dto';
import { TIPOS_CENTRO_COSTO } from './create-centro-costo.dto';

export class CentroCostoReporteQueryDto extends ReporteContableQueryDto {
  @ApiPropertyOptional({ enum: [...TIPOS_CENTRO_COSTO] })
  @IsIn([...TIPOS_CENTRO_COSTO])
  @IsOptional()
  tipo?: string;
}
