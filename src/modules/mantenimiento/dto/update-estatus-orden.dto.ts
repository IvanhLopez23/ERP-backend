import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEstatusOrdenDto {
  @ApiProperty({
    description: 'Nuevo estatus',
    example: 'en_progreso',
    enum: ['en_progreso', 'completada', 'cancelada'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['en_progreso', 'completada', 'cancelada'])
  estatus: string;

  @ApiPropertyOptional({
    description: 'Costo final (al completar)',
    example: 2500,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costo?: number;

  @ApiPropertyOptional({ description: 'Observaciones al cambiar estatus' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
