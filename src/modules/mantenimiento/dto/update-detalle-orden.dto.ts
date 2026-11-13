import { PartialType } from '@nestjs/swagger';
import { CreateDetalleOrdenTrabajoDto } from './create-detalle-orden.dto';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDetalleOrdenTrabajoDto extends PartialType(
  CreateDetalleOrdenTrabajoDto,
) {
  @ApiPropertyOptional({ description: 'Descripción de la tarea' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional({ description: 'Completado' })
  @IsBoolean()
  @IsOptional()
  completado?: boolean;

  @ApiPropertyOptional({ description: 'Observaciones de la tarea' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
