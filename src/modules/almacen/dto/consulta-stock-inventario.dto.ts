import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginacionDto } from '../../../common/dtos/paginacion.dto';
import { IsPublicId } from '../../../common/validation/public-id';

export class ConsultaStockInventarioDto extends PaginacionDto {
  @ApiPropertyOptional({
    description:
      'Filtrar por almacén (publicId). Si se omite, suma la existencia de todos los almacenes.',
  })
  @IsOptional()
  @IsPublicId()
  almacenId?: string;
}
