import { Type } from 'class-transformer';
import { IsDateString, IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePeriodoContableDto {
  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  anio: number;

  @ApiProperty({ example: 11, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @ApiProperty({ example: '2026-11-01' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ example: '2026-11-30' })
  @IsDateString()
  fechaFin: string;
}
