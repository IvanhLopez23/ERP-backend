import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateDetalleSalidaDto {
  @ApiProperty({ description: 'publicId del producto' })
  @IsPublicId()
  @IsNotEmpty()
  productoId: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0.01)
  cantidad: number;
}
