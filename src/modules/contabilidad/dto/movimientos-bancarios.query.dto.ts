import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MovimientosBancariosQueryDto {
  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsDateString()
  @IsOptional()
  desde?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsDateString()
  @IsOptional()
  hasta?: string;

  @ApiPropertyOptional({ example: false })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  conciliado?: boolean;
}

export class ConciliacionQueryDto {
  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsDateString()
  @IsOptional()
  desde?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsDateString()
  @IsOptional()
  hasta?: string;
}
