import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEstatusPermisoDto {
  @ApiProperty({
    description: 'Nuevo estatus',
    example: 'aprobada',
    enum: ['aprobada', 'rechazada'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['aprobada', 'rechazada'])
  estatus: string;
}
