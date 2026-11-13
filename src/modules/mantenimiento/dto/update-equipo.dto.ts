import { PartialType } from '@nestjs/swagger';
import { CreateEquipoDto } from './create-equipo.dto';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEquipoDto extends PartialType(CreateEquipoDto) {
  @ApiPropertyOptional({ description: 'Código único del equipo' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiPropertyOptional({ description: 'Nombre del equipo' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del equipo' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Ubicación del equipo' })
  @IsString()
  @IsOptional()
  ubicacion?: string;

  @ApiPropertyOptional({ description: 'Fecha de adquisición (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  fechaAdquisicion?: string;

  @ApiPropertyOptional({ description: 'Estado del equipo' })
  @IsString()
  @IsOptional()
  @IsIn(['operativo', 'en_reparacion', 'baja'])
  estado?: string;
}
