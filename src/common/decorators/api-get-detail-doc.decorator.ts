import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { RESOURCE_IDENTIFIERS, IdentifierType } from '../constants';
import { GetResponseDto } from '../dtos/get-response.dto';
import { ErrorResponseDto } from '../dtos/error-response.dto';
import { buildErrorExample } from './api-error-responses.decorator';
import { STATUS_CODES } from 'http';

export function ApiGetDetailDoc(
  dto: Type<unknown>,
  resourceName?: string,
  identifier: IdentifierType = 'publicId',
) {
  const resource = resourceName ?? 'registro';

  return applyDecorators(
    ApiOperation({ summary: `Obtener detalle del ${resource}` }),

    ApiParam({
      name: identifier,
      description: `Identificador (${identifier}) del ${resource}`,
      type: identifier === 'publicId' ? String : Number,
      format: identifier === 'publicId' ? 'uuid' : undefined,
      example: RESOURCE_IDENTIFIERS[identifier],
    }),

    ApiExtraModels(GetResponseDto, dto),
    ApiOkResponse({
      description: STATUS_CODES[HttpStatus.OK],
      schema: {
        allOf: [
          { $ref: getSchemaPath(GetResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(dto) },
            },
          },
        ],
      },
    }),

    ApiNotFoundResponse({
      description: `${resource} no encontrado`,
      type: ErrorResponseDto,
      example: buildErrorExample(HttpStatus.NOT_FOUND),
    }),
  );
}
