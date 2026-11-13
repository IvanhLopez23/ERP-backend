import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';
import { CreateDetalleCotizacionDto } from './create-detalle-cotizacion.dto';

export class CreateCotizacionDto {
  @ApiProperty({
    description: 'publicId del cliente',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsNotEmpty()
  clienteId: string;

  @ApiPropertyOptional({
    description: 'Fecha (YYYY-MM-DD)',
    example: '2024-03-01',
  })
  @IsString()
  @IsOptional()
  fecha?: string;

  @ApiPropertyOptional({ description: 'Días de validez', example: 30 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  diasValidez?: number;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'publicId del vendedor (RH)' })
  @IsPublicId()
  @IsOptional()
  vendedorId?: string;

  @ApiProperty({
    description: 'Detalles de la cotización',
    type: [CreateDetalleCotizacionDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleCotizacionDto)
  detalles: CreateDetalleCotizacionDto[];
}
