import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PagedResponseDto<T = unknown> {
  @ApiProperty({
    example: 0,
    description: 'Total de registros que coinciden con la consulta',
  })
  total: number;

  @ApiPropertyOptional({ description: 'Registros de la página solicitada' })
  data: T[];
}
