import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class CreatePoliticaVacacionalDto {
  @ApiProperty({ description: 'Antigüedad mínima en años', example: 1 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  aniosDesde: number;

  @ApiPropertyOptional({ description: 'Antigüedad máxima en años' })
  @IsInt()
  @Min(1)
  @IsOptional()
  aniosHasta?: number;

  @ApiProperty({ description: 'Días de vacaciones otorgados', example: 12 })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  diasOtorgados: number;
}
