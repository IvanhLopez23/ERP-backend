import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { STATUS_CODES } from 'http';
import { GetResponseDto } from '../dtos/get-response.dto';

export function ApiGetDoc(dto: Type<unknown>, resourceName?: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Obtener catálogo de ${resourceName ?? 'registros'}`,
    }),

    ApiExtraModels(GetResponseDto, dto),
    ApiOkResponse({
      description: STATUS_CODES[HttpStatus.OK],
      schema: {
        allOf: [
          { $ref: getSchemaPath(GetResponseDto) },
          {
            properties: {
              data: { type: 'array', items: { $ref: getSchemaPath(dto) } },
            },
          },
        ],
      },
    }),
  );
}
