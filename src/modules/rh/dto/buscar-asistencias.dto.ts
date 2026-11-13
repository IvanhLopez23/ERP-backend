import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginacionDto } from '../../../common/dtos/paginacion.dto';
import { IsPublicId } from '../../../common/validation/public-id';

export class BuscarAsistenciasDto extends PaginacionDto {
  @ApiPropertyOptional({
    description: 'Filtrar por empleado (publicId)',
  })
  @IsOptional()
  @IsPublicId()
  empleadoId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por departamento (publicId)',
  })
  @IsOptional()
  @IsPublicId()
  departamentoId?: string;

  @ApiPropertyOptional({
    description: 'Fecha exacta (YYYY-MM-DD). Devuelve todos los empleados activos.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener el formato YYYY-MM-DD',
  })
  fecha?: string;

  @ApiPropertyOptional({
    description: 'Fecha inicial del rango (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha final del rango (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  fechaHasta?: string;
}
