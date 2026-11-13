import { ApiProperty } from '@nestjs/swagger';
import { RESPONSE_MESSAGES } from '../constants/response-messages.constant';

export class UpdateResponseDto {
  @ApiProperty({
    example: RESPONSE_MESSAGES.UPDATE,
    description: 'Mensaje de confirmación de actualización',
  })
  message: string;
}
