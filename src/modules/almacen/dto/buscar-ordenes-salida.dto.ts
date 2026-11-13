import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginacionDto } from '../../../common/dtos/paginacion.dto';
import { IsPublicId } from '../../../common/validation/public-id';

export class BuscarOrdenesSalidaDto extends PaginacionDto {
  @ApiPropertyOptional({ description: 'Filtrar por almacén (publicId)' })
  @IsOptional()
  @IsPublicId()
  almacenId?: string;

  @ApiPropertyOptional({ description: 'Fecha inicial (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @ApiPropertyOptional({ description: 'Fecha final (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  fechaHasta?: string;
}
