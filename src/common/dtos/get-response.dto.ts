import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetResponseDto<T = unknown> {
  @ApiPropertyOptional({ description: 'Datos solicitados' })
  data?: T;
}
