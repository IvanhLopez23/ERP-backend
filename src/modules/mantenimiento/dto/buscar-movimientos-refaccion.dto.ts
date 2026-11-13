import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginacionDto } from '../../../common/dtos/paginacion.dto';
import { IsPublicId } from '../../../common/validation/public-id';

export class BuscarMovimientosRefaccionDto extends PaginacionDto {
  @ApiPropertyOptional({
    description: 'Filtrar por refacción (publicId)',
  })
  @IsOptional()
  @IsPublicId()
  refaccionId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de movimiento',
    enum: ['entrada', 'salida', 'ajuste'],
  })
  @IsOptional()
  @IsIn(['entrada', 'salida', 'ajuste'])
  tipo?: string;
}
