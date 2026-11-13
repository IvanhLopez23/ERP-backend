import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginacionDto } from '../../../common/dtos/paginacion.dto';
import { IsPublicId } from '../../../common/validation/public-id';

export class FiltrarPuestosDto extends PaginacionDto {
  @ApiPropertyOptional({
    description: 'publicId del departamento para filtrar los puestos',
  })
  @IsPublicId()
  @IsOptional()
  departamentoId?: string;
}
