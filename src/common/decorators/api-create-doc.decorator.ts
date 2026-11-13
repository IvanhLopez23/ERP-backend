import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiExtraModels,
  ApiCreatedResponse,
  ApiConflictResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateResponseDto } from '../dtos/create-response.dto';
import { ErrorResponseDto } from '../dtos/error-response.dto';
import { buildErrorExample } from './api-error-responses.decorator';
import { STATUS_CODES } from 'http';

export function ApiCreateDoc(dto: Type<unknown>, resourceName?: string) {
  const resource = resourceName ?? 'registro';

  return applyDecorators(
    ApiOperation({ summary: `Crear un nuevo ${resource}` }),

    ApiExtraModels(CreateResponseDto, dto),
    ApiCreatedResponse({
      description: STATUS_CODES[HttpStatus.CREATED],
      schema: {
        allOf: [
          { $ref: getSchemaPath(CreateResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(dto) },
            },
          },
        ],
      },
    }),

    ApiConflictResponse({
      description: `Conflicto: El ${resource} ya existe`,
      type: ErrorResponseDto,
      example: buildErrorExample(HttpStatus.CONFLICT),
    }),
  );
}
