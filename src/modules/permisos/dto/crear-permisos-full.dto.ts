import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsPublicId } from '../../../common/validation/public-id';
import { PantallaPermisoFullDto } from './pantalla-permiso-full.dto';

export class CrearPermisoFullDto {
  @ApiProperty({
    description: 'publicId del rol',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  rolPublicId: string;

  @ApiProperty({
    description: 'Listado de pantallas con sus respectivos accesos',
    type: [PantallaPermisoFullDto], // <-- CRUCIAL para Swagger: define que es un arreglo de ese DTO
  })
  @IsArray()
  @ValidateNested({ each: true }) // Valida los objetos de adentro
  @Type(() => PantallaPermisoFullDto) // Transforma el JSON al tipo de clase correcto
  pantallas: PantallaPermisoFullDto[];
}
