import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUnidadMedidaDto {
  @ApiProperty({
    description: 'Nombre de la unidad de medida',
    example: 'Kilogramo',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    description: 'Abreviatura de la unidad',
    example: 'kg',
  })
  @IsString()
  @IsNotEmpty()
  abreviatura: string;
}
