import { IsDateString, IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export type AgrupacionDashboard = 'dia' | 'semana' | 'mes';

export class RangoDashboardDto {
  @ApiPropertyOptional({
    description:
      'Fecha inicial (YYYY-MM-DD). Por defecto: primer día del mes de hace 11 meses',
    example: '2025-10-01',
  })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({
    description: 'Fecha final (YYYY-MM-DD). Por defecto: hoy',
    example: '2026-09-28',
  })
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional({
    description:
      'Agrupación temporal. Si es "dia" y el rango supera 62 días, se agrupa por semana',
    enum: ['dia', 'semana', 'mes'],
    default: 'mes',
  })
  @IsOptional()
  @IsIn(['dia', 'semana', 'mes'])
  agrupacion?: AgrupacionDashboard;
}
