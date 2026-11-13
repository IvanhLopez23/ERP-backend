import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class ReporteContableQueryDto {
  @ApiPropertyOptional({ description: 'publicId del periodo contable' })
  @IsPublicId()
  @IsOptional()
  periodoId?: string;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsDateString()
  @IsOptional()
  desde?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsDateString()
  @IsOptional()
  hasta?: string;
}
