import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ImportarMovimientosQueryDto {
  @ApiPropertyOptional({
    enum: ['auto', 'csv', 'ofx'],
    default: 'auto',
    description: 'Formato del archivo. Default: detectar automáticamente',
  })
  @IsIn(['auto', 'csv', 'ofx'])
  @IsOptional()
  formato?: 'auto' | 'csv' | 'ofx';
}
