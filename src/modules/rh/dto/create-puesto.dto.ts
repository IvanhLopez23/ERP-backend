import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreatePuestoDto {
  @ApiProperty({
    description: 'Nombre del puesto',
    example: 'Ingeniero de Software',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del puesto' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Salario mínimo', example: 15000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salarioMinimo?: number;

  @ApiPropertyOptional({ description: 'Salario máximo', example: 35000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salarioMaximo?: number;

  @ApiPropertyOptional({
    description: 'Departamento al que pertenece el puesto (publicId)',
  })
  @IsOptional()
  @IsPublicId()
  departamentoId?: string;
}
