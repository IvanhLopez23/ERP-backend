import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePolizaDetalleDto } from './create-poliza-detalle.dto';
import { TIPOS_POLIZA } from '../contabilidad.constants';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreatePolizaDto {
  @ApiProperty({ example: '2026-11-10' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ enum: [...TIPOS_POLIZA], example: 'diario' })
  @IsIn([...TIPOS_POLIZA])
  tipo: string;

  @ApiProperty({ example: 'Aporte de capital' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  concepto: string;

  @ApiPropertyOptional({
    description:
      'publicId del centro de costo/área/proyecto. Aplica a los detalles que no tengan uno propio.',
  })
  @IsPublicId()
  @IsOptional()
  centroCostoId?: string;

  @ApiProperty({
    type: [CreatePolizaDetalleDto],
    description: 'Debe y haber deben sumar lo mismo',
  })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreatePolizaDetalleDto)
  detalles: CreatePolizaDetalleDto[];
}
