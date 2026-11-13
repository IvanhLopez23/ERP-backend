import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginacionDto } from '../../../common/dtos/paginacion.dto';
import { IsPublicId } from '../../../common/validation/public-id';
import { ESTATUS_POLIZA, TIPOS_POLIZA } from '../contabilidad.constants';

export class PaginarPolizasDto extends PaginacionDto {
  @ApiPropertyOptional({ enum: [...ESTATUS_POLIZA] })
  @IsIn([...ESTATUS_POLIZA])
  @IsOptional()
  estatus?: string;

  @ApiPropertyOptional({ enum: [...TIPOS_POLIZA] })
  @IsIn([...TIPOS_POLIZA])
  @IsOptional()
  tipo?: string;

  @ApiPropertyOptional({ description: 'publicId del periodo contable' })
  @IsPublicId()
  @IsOptional()
  periodoId?: string;
}
