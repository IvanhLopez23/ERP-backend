import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreatePantallaDto {
  @ApiProperty({
    description: 'Nombre de pantalla',
    example: 'Ejemplo',
  })
  @IsString()
  @IsNotEmpty()
  readonly nombre: string;

  @ApiProperty({
    description: 'Ruta de pantalla',
    example: '/ejemplo',
  })
  @IsString()
  @IsNotEmpty()
  readonly ruta: string;

  @ApiProperty({
    description: 'Icono de pantalla',
    example: 'mdi-ejemplo',
  })
  @IsString()
  @IsNotEmpty()
  readonly icono: string;

  @ApiProperty({
    description: 'Orden de Pantalla',
    example: 3,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly orden: number;

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

  @ApiProperty({
    description: 'Nombre del modulo al que pertenece la pantalla',
  })
  @IsString()
  @IsOptional()
  readonly modulo?: string;
}
