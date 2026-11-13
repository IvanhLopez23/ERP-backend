import { PartialType } from '@nestjs/swagger';
import { CreatePuestoDto } from './create-puesto.dto';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePuestoDto extends PartialType(CreatePuestoDto) {
  @ApiPropertyOptional({ description: 'Nombre del puesto' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del puesto' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Salario mínimo' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salarioMinimo?: number;

  @ApiPropertyOptional({ description: 'Salario máximo' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salarioMaximo?: number;
}
