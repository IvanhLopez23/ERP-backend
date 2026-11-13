import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginacionDto } from '../../../common/dtos/paginacion.dto';
import { IsPublicId } from '../../../common/validation/public-id';

export class BuscarCortesInventarioDto extends PaginacionDto {
  @ApiPropertyOptional({ description: 'Filtrar por almacén (publicId)' })
  @IsOptional()
  @IsPublicId()
  almacenId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por año', example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anio?: number;
}
