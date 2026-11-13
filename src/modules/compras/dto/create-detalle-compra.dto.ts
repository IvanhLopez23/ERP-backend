import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateDetalleCompraDto {
  @ApiProperty({
    description: 'publicId del producto',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsNotEmpty()
  productoId: string;

  @ApiProperty({
    description: 'Cantidad del producto',
    example: 5,
  })
  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @ApiProperty({
    description: 'Precio unitario',
    example: 15000.5,
  })
  @IsNumber()
  @Min(0)
  precioUnitario: number;
}
