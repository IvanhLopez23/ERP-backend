import { IsNumber, IsNotEmpty, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateDetalleCotizacionDto {
  @ApiProperty({
    description: 'publicId del producto',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsNotEmpty()
  productoId: string;

  @ApiProperty({ description: 'Cantidad', example: 5 })
  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario', example: 19999.99 })
  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @ApiPropertyOptional({ description: 'Descuento (%)', example: 10 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  descuento?: number;
}
