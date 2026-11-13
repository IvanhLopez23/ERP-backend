import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDetalleOrdenTrabajoDto {
  @ApiProperty({
    description: 'Descripción de la tarea',
    example: 'Revisar niveles de aceite',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional({ description: 'Completado', default: false })
  @IsBoolean()
  @IsOptional()
  completado?: boolean;

  @ApiPropertyOptional({ description: 'Observaciones de la tarea' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
