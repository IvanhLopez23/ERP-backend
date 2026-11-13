import { PartialType } from '@nestjs/swagger';
import { CreateAlmacenDto } from './create-almacen.dto';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAlmacenDto extends PartialType(CreateAlmacenDto) {
  @ApiPropertyOptional({ description: 'Nombre del almacén' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ description: 'Ubicación del almacén' })
  @IsString()
  @IsOptional()
  ubicacion?: string;
}
