import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginacionDto } from '../../../common/dtos/paginacion.dto';
import { IsPublicId } from '../../../common/validation/public-id';

export class ConsultaSaldoVacacionalDto extends PaginacionDto {
  @ApiPropertyOptional({
    description:
      'Filtrar por empleado (publicId). Si se envía, devuelve un solo registro.',
  })
  @IsOptional()
  @IsPublicId()
  empleadoId?: string;

  @ApiPropertyOptional({
    description: 'Fecha de corte (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  fechaCorte?: string;

  @ApiPropertyOptional({
    description:
      'Filtrar por estatus del empleado. Si se omite, devuelve activos e inactivos.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  activo?: boolean;
}
