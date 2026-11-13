import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEstatusVentaDto {
  @ApiProperty({
    description: 'Nuevo estatus',
    example: 'completada',
    enum: ['completada', 'cancelada'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['completada', 'cancelada'])
  estatus: string;
}
