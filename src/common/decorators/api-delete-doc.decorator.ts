import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { RESOURCE_IDENTIFIERS, IdentifierType } from '../constants';
import { DeleteResponseDto } from '../dtos/delete-response.dto';
import { ErrorResponseDto } from '../dtos/error-response.dto';
import { buildErrorExample } from './api-error-responses.decorator';
import { STATUS_CODES } from 'http';

export function ApiDeleteDoc(
  resourceName?: string,
  identifier: IdentifierType = 'publicId',
) {
  const resource = resourceName ?? 'registro';

  return applyDecorators(
    ApiOperation({ summary: `Eliminar un ${resource}` }),

    ApiParam({
      name: identifier,
      description: `Identificador (${identifier}) del ${resource}`,
      type: identifier === 'publicId' ? String : Number,
      format: identifier === 'publicId' ? 'uuid' : undefined,
      example: RESOURCE_IDENTIFIERS[identifier],
    }),

    ApiOkResponse({
      description: STATUS_CODES[HttpStatus.OK],
      type: DeleteResponseDto,
    }),

    ApiNotFoundResponse({
      description: `${resource} no encontrado`,
      type: ErrorResponseDto,
      example: buildErrorExample(HttpStatus.NOT_FOUND),
    }),
  );
}
