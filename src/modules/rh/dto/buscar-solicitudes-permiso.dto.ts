import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginacionDto } from '../../../common/dtos/paginacion.dto';
import { IsPublicId } from '../../../common/validation/public-id';

export class BuscarSolicitudesPermisoDto extends PaginacionDto {
  @ApiPropertyOptional({
    description: 'Filtrar por empleado (publicId)',
  })
  @IsOptional()
  @IsPublicId()
  empleadoId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estatus',
    example: 'pendiente',
  })
  @IsOptional()
  @IsString()
  estatus?: string;
}
