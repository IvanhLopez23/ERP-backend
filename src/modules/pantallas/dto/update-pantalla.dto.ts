import { PartialType } from '@nestjs/mapped-types';
import { CreatePantallaDto } from './create-pantalla.dto';
import { IsNumber, IsString, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class UpdatePantallaDto extends PartialType(CreatePantallaDto) {
  @ApiProperty({
    description: 'Nombre de pantalla',
    example: 'Ejemplo',
  })
  @IsString()
  @IsOptional()
  readonly nombre?: string;
  @ApiProperty({
    description: 'Ruta de pantalla',
    example: '/ejemplo',
  })
  @IsString()
  @IsOptional()
  readonly ruta?: string;
  @ApiProperty({
    description: 'Icono de pantalla',
    example: 'mdi-ejemplo',
  })
  @IsString()
  @IsOptional()
  readonly icono?: string;
  @ApiProperty({
    description: 'Orden de Pantalla',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly orden?: number;
  @ApiPropertyOptional({
    description: 'publicId de la pantalla padre',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsOptional()
  readonly padreId?: string;
  @ApiPropertyOptional({
    description: 'Nombre de pantalla sub menu si tiene padre',
  })
  @IsString()
  @IsOptional()
  readonly subMenu?: string;
  @ApiPropertyOptional({
    description: 'Nombre del modulo al que pertenece la pantalla padre',
  })
  @IsString()
  @IsOptional()
  readonly modulo?: string;
}
