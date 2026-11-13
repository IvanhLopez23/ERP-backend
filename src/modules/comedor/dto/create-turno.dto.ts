import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateTurnoDto {
  @ApiProperty({ example: 'Turno semanal matutino' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ enum: ['semanal', 'quincenal', 'mensual'] })
  @IsIn(['semanal', 'quincenal', 'mensual'])
  periodicidad: string;
}
