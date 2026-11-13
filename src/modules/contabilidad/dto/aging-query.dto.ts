import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AgingQueryDto {
  @ApiPropertyOptional({
    description: 'Fecha de corte (YYYY-MM-DD). Default: hoy',
    example: '2026-11-10',
  })
  @IsDateString()
  @IsOptional()
  fechaCorte?: string;
}
