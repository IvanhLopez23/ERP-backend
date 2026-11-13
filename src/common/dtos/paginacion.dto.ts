import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min, IsString } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class PaginacionDto {
  @ApiProperty({
    description: 'Número de página',
    default: 1,
    example: 1,
  })
  @Min(1)
  @Type(() => Number)
  pagina: number = 1;

  @ApiProperty({
    description: 'Número de registros por página',
    default: 10,
    example: 10,
  })
  @IsPositive()
  @Type(() => Number)
  registros: number = 10;

  @ApiPropertyOptional({
    description: 'Texto de búsqueda para filtrar resultados',
  })
  @IsOptional()
  @IsString()
  buscar?: string;
}
