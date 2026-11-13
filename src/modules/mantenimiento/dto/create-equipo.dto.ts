import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEquipoDto {
  @ApiProperty({ description: 'Código único del equipo', example: 'EQ-001' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({ description: 'Nombre del equipo', example: 'Torno CNC' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del equipo' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Ubicación del equipo',
    example: 'Planta Baja - Área Producción',
  })
  @IsString()
  @IsOptional()
  ubicacion?: string;

  @ApiPropertyOptional({ description: 'Fecha de adquisición (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  fechaAdquisicion?: string;

  @ApiPropertyOptional({
    description: 'Estado del equipo',
    example: 'operativo',
    enum: ['operativo', 'en_reparacion', 'baja'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['operativo', 'en_reparacion', 'baja'])
  estado?: string;
}
