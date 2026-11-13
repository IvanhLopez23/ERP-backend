import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateSolicitudComedorDto {
  @ApiProperty({ format: 'uuid', description: 'publicId UUID v7 del menú' })
  @IsPublicId()
  menuPublicId: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'publicIds UUID v7 de las comidas seleccionadas',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsPublicId({ each: true })
  menuItemPublicIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}
