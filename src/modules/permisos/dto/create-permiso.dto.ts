import { IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreatePermisoDto {
  @ApiProperty({
    description: 'publicId de pantalla',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsNotEmpty({ message: 'El id de la pantalla es requerido' })
  pantallaId: string;
  @ApiProperty({
    description: 'publicId del rol asignado',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsNotEmpty({ message: 'El id del rol es requerido' })
  rolId: string;
  @ApiProperty({ description: 'Accion boolean', example: true })
  @IsBoolean({ message: 'El permiso de ver debe ser un booleano' })
  @IsNotEmpty({ message: 'El permiso de ver es requerido' })
  ver: boolean;
  @ApiProperty({ description: 'Accion boolean', example: true })
  @IsBoolean({ message: 'El permiso de crear debe ser un booleano' })
  @IsNotEmpty({ message: 'El permiso de crear es requerido' })
  crear: boolean;
  @ApiProperty({ description: 'Accion boolean', example: true })
  @IsBoolean({ message: 'El permiso de editar debe ser un booleano' })
  @IsNotEmpty({ message: 'El permiso de editar es requerido' })
  editar: boolean;
  @ApiProperty({ description: 'Accion boolean', example: true })
  @IsBoolean({ message: 'El permiso de eliminar debe ser un booleano' })
  @IsNotEmpty({ message: 'El permiso de eliminar es requerido' })
  eliminar: boolean;
  @ApiProperty({ description: 'Accion boolean', example: true })
  @IsBoolean({ message: 'El permiso de adjuntos debe ser un booleano' })
  @IsNotEmpty({ message: 'El permiso de adjuntos es requerido' })
  adjuntos: boolean;
  @ApiProperty({ description: 'Accion boolean', example: true })
  @IsBoolean({ message: 'El permiso de reportes debe ser un booleano' })
  @IsNotEmpty({ message: 'El permiso de reportes es requerido' })
  reportes: boolean;
  @ApiProperty({
    description: 'publicId del usuario heredado; el permiso se aplica al rol',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
    required: false,
  })
  @IsPublicId()
  @IsOptional()
  usuarioId?: string;
}
