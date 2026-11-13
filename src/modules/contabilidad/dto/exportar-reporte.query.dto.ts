import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReporteContableQueryDto } from './reporte-contable.query.dto';
import { IsPublicId } from '../../../common/validation/public-id';

export const FORMATOS_EXPORTACION = ['xlsx', 'pdf'] as const;
export type FormatoExportacion = (typeof FORMATOS_EXPORTACION)[number];

export const REPORTES_EXPORTABLES = [
  'balanza',
  'estado-resultados',
  'balance-general',
  'mayor',
  'auxiliar-clientes',
  'auxiliar-proveedores',
  'iva',
  'iva-mensual',
] as const;
export type ReporteExportable = (typeof REPORTES_EXPORTABLES)[number];

export class ExportarReporteQueryDto extends ReporteContableQueryDto {
  @ApiPropertyOptional({
    enum: [...FORMATOS_EXPORTACION],
    default: 'xlsx',
    description: 'Formato del archivo',
  })
  @IsIn([...FORMATOS_EXPORTACION])
  @IsOptional()
  formato?: FormatoExportacion;

  @ApiPropertyOptional({
    description: 'publicId de la cuenta contable (requerido para mayor)',
  })
  @IsPublicId()
  @IsOptional()
  cuentaId?: string;

  @ApiPropertyOptional({
    description: 'publicId del cliente (auxiliar-clientes)',
  })
  @IsPublicId()
  @IsOptional()
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'publicId del proveedor (auxiliar-proveedores)',
  })
  @IsPublicId()
  @IsOptional()
  proveedorId?: string;

  @ApiPropertyOptional({
    description: 'Año fiscal (iva-mensual). Default: año actual',
    example: 2026,
  })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  anio?: number;
}
