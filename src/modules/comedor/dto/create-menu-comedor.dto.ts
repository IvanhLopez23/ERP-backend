import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuComedorItemDto {
  @ApiProperty({ example: '2026-07-06', format: 'date' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ enum: ['desayuno', 'comida', 'cena'] })
  @IsIn(['desayuno', 'comida', 'cena'])
  tipoComida: string;

  @ApiProperty({ example: 'Pollo a la plancha con ensalada' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;
}

export class CreateMenuComedorDto {
  @ApiProperty({ example: 'Menú semanal julio 2026' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ enum: ['semanal', 'quincenal', 'mensual'] })
  @IsIn(['semanal', 'quincenal', 'mensual'])
  periodicidad: string;

  @ApiProperty({ example: '2026-07-06', format: 'date' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ example: '2026-07-12', format: 'date' })
  @IsDateString()
  fechaFin: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  activo?: boolean;

  @ApiProperty({ type: [CreateMenuComedorItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMenuComedorItemDto)
  items: CreateMenuComedorItemDto[];
}
