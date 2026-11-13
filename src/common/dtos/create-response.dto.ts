import { ApiProperty } from '@nestjs/swagger';
import { RESPONSE_MESSAGES } from '../constants/response-messages.constant';

export class CreateResponseDto<T = unknown> {
  @ApiProperty({
    example: RESPONSE_MESSAGES.CREATE,
    description: 'Mensaje de confirmación de creación',
  })
  message: string;

  @ApiProperty({ description: 'Datos del registro creado' })
  data: T;
}
