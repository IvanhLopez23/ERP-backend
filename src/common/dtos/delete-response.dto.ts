import { ApiProperty } from '@nestjs/swagger';
import { RESPONSE_MESSAGES } from '../constants/response-messages.constant';

export class DeleteResponseDto {
  @ApiProperty({
    example: RESPONSE_MESSAGES.DELETE,
    description: 'Mensaje de confirmación de eliminación',
  })
  message: string;
}
