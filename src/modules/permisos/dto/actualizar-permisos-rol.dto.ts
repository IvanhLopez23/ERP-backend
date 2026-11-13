import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { IsPublicId } from '../../../common/validation/public-id';
import { PantallaPermisoDto } from './pantalla-permiso.dto';

export class ActualizarPermisosRolDto {
  @ApiProperty({
    description: 'publicId del rol',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  rolId: string;

  @ApiProperty({ type: [PantallaPermisoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PantallaPermisoDto)
  pantallas: PantallaPermisoDto[];
}
