import { PartialType } from '@nestjs/swagger';
import { CreateDepartamentoDto } from './create-departamento.dto';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDepartamentoDto extends PartialType(CreateDepartamentoDto) {
  @ApiPropertyOptional({ description: 'Nombre del departamento' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del departamento' })
  @IsString()
  @IsOptional()
  descripcion?: string;
}
