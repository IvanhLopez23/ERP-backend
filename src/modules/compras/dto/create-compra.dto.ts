import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';
import { CreateDetalleCompraDto } from './create-detalle-compra.dto';

export class CreateCompraDto {
  @ApiProperty({
    description: 'publicId del proveedor',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsNotEmpty()
  proveedorId: string;

  @ApiProperty({
    description: 'publicId del almacén de destino',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsNotEmpty()
  almacenId: string;

  @ApiProperty({
    description: 'Fecha de la compra (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsString()
  @IsNotEmpty()
  fechaCompra: string;

  @ApiPropertyOptional({
    description: 'Observaciones de la compra',
  })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'publicId del centro de costo/área/proyecto',
  })
  @IsPublicId()
  @IsOptional()
  centroCostoId?: string;

  @ApiProperty({
    description: 'Detalles de la compra (productos)',
    type: [CreateDetalleCompraDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleCompraDto)
  detalles: CreateDetalleCompraDto[];
}
