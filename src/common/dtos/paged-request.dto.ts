import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PagedRequestDto {
  @ApiPropertyOptional({
    description: 'Número de página (default: 1)',
    default: 1,
    minimum: 1,
  })
  @Type(() => Number) // Convierte el texto de la URL a número
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página (default: 25)',
    default: 25,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 25;

  @ApiPropertyOptional({
    description: 'Texto de búsqueda',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
