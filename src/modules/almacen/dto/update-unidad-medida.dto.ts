import { PartialType } from '@nestjs/swagger';
import { CreateUnidadMedidaDto } from './create-unidad-medida.dto';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUnidadMedidaDto extends PartialType(CreateUnidadMedidaDto) {
  @ApiPropertyOptional({
    description: 'Nombre de la unidad de medida',
    example: 'Kilogramo',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({
    description: 'Abreviatura de la unidad',
    example: 'kg',
  })
  @IsString()
  @IsNotEmpty()
  abreviatura: string;
}
