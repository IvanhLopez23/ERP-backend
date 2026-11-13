import { PartialType } from '@nestjs/swagger';
import { CreateContratoDto } from './create-contrato.dto';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class UpdateContratoDto extends PartialType(CreateContratoDto) {
  @ApiPropertyOptional({ description: 'publicId del empleado' })
  @IsOptional()
  @IsPublicId()
  empleadoId?: string;

  @ApiPropertyOptional({ description: 'Tipo de contrato' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['indeterminado', 'temporal', 'obra'])
  tipo: string;

  @ApiPropertyOptional({ description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  fechaInicio: string;

  @ApiPropertyOptional({ description: 'Fecha de fin (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  fechaFin?: string;

  @ApiPropertyOptional({ description: 'Salario del contrato' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salario?: number;
}
