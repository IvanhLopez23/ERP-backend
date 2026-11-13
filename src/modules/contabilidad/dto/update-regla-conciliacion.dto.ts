import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateReglaConciliacionDto } from './create-regla-conciliacion.dto';
import { IsPublicId } from '../../../common/validation/public-id';

export class UpdateReglaConciliacionDto extends PartialType(
  CreateReglaConciliacionDto,
) {}

export class ReglasConciliacionQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por publicId de cuenta bancaria',
  })
  @IsPublicId()
  @IsOptional()
  cuentaBancariaId?: string;
}
