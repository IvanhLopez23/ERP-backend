import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { IsPublicId } from '../../../common/validation/public-id';

export class PantallaPermisoDto {
  @ApiProperty({
    description: 'publicId de la pantalla',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  pantallaId: string;

  @ApiProperty({ description: 'Permiso para ver', example: true })
  @IsBoolean()
  ver: boolean;

  @ApiProperty({ description: 'Permiso para crear', example: true })
  @IsBoolean()
  crear: boolean;

  @ApiProperty({ description: 'Permiso para editar', example: false })
  @IsBoolean()
  editar: boolean;

  @ApiProperty({ description: 'Permiso para eliminar', example: false })
  @IsBoolean()
  eliminar: boolean;

  @ApiProperty({ description: 'Permiso para manejar adjuntos', example: false })
  @IsBoolean()
  adjuntos: boolean;

  @ApiProperty({ description: 'Permiso para ver reportes', example: true })
  @IsBoolean()
  reportes: boolean;
}
