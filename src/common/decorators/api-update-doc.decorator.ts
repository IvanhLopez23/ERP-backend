import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { RESOURCE_IDENTIFIERS, IdentifierType } from '../constants';
import { UpdateResponseDto } from '../dtos/update-response.dto';
import { ErrorResponseDto } from '../dtos/error-response.dto';
import { buildErrorExample } from './api-error-responses.decorator';
import { STATUS_CODES } from 'http';

export function ApiUpdateDoc(
  resourceName?: string,
  identifier: IdentifierType = 'publicId',
) {
  const resource = resourceName ?? 'registro';

  return applyDecorators(
    ApiOperation({ summary: `Actualizar un ${resource}` }),

    ApiParam({
      name: identifier,
      description: `Identificador (${identifier}) del ${resource}`,
      type: identifier === 'publicId' ? String : Number,
      format: identifier === 'publicId' ? 'uuid' : undefined,
      example: RESOURCE_IDENTIFIERS[identifier],
    }),

    ApiOkResponse({
      description: STATUS_CODES[HttpStatus.OK],
      type: UpdateResponseDto,
    }),

    ApiNotFoundResponse({
      description: `${resource} no encontrado`,
      type: ErrorResponseDto,
      example: buildErrorExample(HttpStatus.NOT_FOUND),
    }),

    ApiConflictResponse({
      description: `Conflicto: La actualización entra en conflicto con un ${resource} existente`,
      type: ErrorResponseDto,
      example: buildErrorExample(HttpStatus.CONFLICT),
    }),
  );
}
