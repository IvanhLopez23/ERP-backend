import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEstatusCotizacionDto {
  @ApiProperty({
    description: 'Nuevo estatus',
    example: 'aprobada',
    enum: ['aprobada', 'vencida', 'rechazada'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['aprobada', 'vencida', 'rechazada'])
  estatus: string;
}
