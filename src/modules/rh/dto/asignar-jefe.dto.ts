import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class AsignarJefeDto {
  @ApiPropertyOptional({
    description:
      'publicId del empleado jefe. Omitirlo o enviarlo en null limpia el jefe',
    example: '01a0b13f-fe3f-7797-bb8e-1265f4409c78',
  })
  @IsOptional()
  @IsPublicId()
  jefeId?: string | null;
}
