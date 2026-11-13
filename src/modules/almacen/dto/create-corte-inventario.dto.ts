import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class CreateCorteInventarioDto {
  @ApiProperty({ description: 'publicId del almacén' })
  @IsPublicId()
  @IsNotEmpty()
  almacenId: string;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio: number;

  @ApiProperty({ example: 11, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;
}
