import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CrearConversacionDto {
  @ApiProperty({
    description:
      'publicIds de los participantes a agregar (excluyendo al creador)',
    example: ['01a0da84-b398-7398-92f2-c0921f026ef2'],
  })
  @IsArray()
  @IsPublicId({ each: true })
  @ArrayMinSize(1)
  participanteIds: string[];

  @ApiProperty({
    description: 'Indica si es un grupo',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  esGrupo?: boolean;

  @ApiProperty({
    description: 'Nombre del grupo (requerido si esGrupo es true)',
    example: 'Proyecto X',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;
}
