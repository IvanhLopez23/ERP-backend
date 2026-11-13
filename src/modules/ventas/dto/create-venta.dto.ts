import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';
import { CreateDetalleVentaDto } from './create-detalle-venta.dto';

export class CreateVentaDto {
  @ApiProperty({
    description: 'publicId del cliente',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsNotEmpty()
  clienteId: string;

  @ApiPropertyOptional({ description: 'publicId de la cotización (si aplica)' })
  @IsPublicId()
  @IsOptional()
  cotizacionId?: string;

  @ApiPropertyOptional({
    description: 'Fecha de venta (YYYY-MM-DD)',
    example: '2024-03-15',
  })
  @IsString()
  @IsOptional()
  fechaVenta?: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'publicId del vendedor (RH)' })
  @IsPublicId()
  @IsOptional()
  vendedorId?: string;

  @ApiPropertyOptional({
    description: 'publicId del centro de costo/área/proyecto',
  })
  @IsPublicId()
  @IsOptional()
  centroCostoId?: string;

  @ApiProperty({
    description: 'Detalles de la venta',
    type: [CreateDetalleVentaDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleVentaDto)
  detalles: CreateDetalleVentaDto[];
}
