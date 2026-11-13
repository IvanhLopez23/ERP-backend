import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConciliarAutomaticoDto {
  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsDateString()
  @IsOptional()
  desde?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsDateString()
  @IsOptional()
  hasta?: string;

  @ApiPropertyOptional({
    example: 3,
    default: 3,
    description: 'Días de tolerancia entre la fecha del banco y la póliza',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  @IsOptional()
  toleranciaDias?: number;
}
