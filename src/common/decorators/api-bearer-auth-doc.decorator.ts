import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { STATUS_CODES } from 'http';
import { ErrorResponseDto } from '../dtos/error-response.dto';
import { buildErrorExample } from './api-error-responses.decorator';

export function ApiBearerAuthDoc() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: STATUS_CODES[HttpStatus.UNAUTHORIZED],
      type: ErrorResponseDto,
      example: buildErrorExample(HttpStatus.UNAUTHORIZED),
    }),
    ApiForbiddenResponse({
      description: STATUS_CODES[HttpStatus.FORBIDDEN],
      type: ErrorResponseDto,
      example: buildErrorExample(HttpStatus.FORBIDDEN),
    }),
  );
}
