import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEstatusCompraDto {
  @ApiProperty({
    description: 'Nuevo estatus de la compra',
    example: 'recibida',
    enum: ['pendiente', 'recibida', 'cancelada'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['pendiente', 'recibida', 'cancelada'])
  estatus: string;
}
