import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginacionDto } from '../../../common/dtos/paginacion.dto';
import { ESTATUS_CARTERA } from '../contabilidad.constants';

export class FiltrarCarteraDto extends PaginacionDto {
  @ApiPropertyOptional({ enum: [...ESTATUS_CARTERA] })
  @IsIn([...ESTATUS_CARTERA])
  @IsOptional()
  estatus?: string;

  @ApiPropertyOptional({
    description: 'Solo registros con saldo y fecha de vencimiento pasada',
  })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  vencidas?: boolean;
}
