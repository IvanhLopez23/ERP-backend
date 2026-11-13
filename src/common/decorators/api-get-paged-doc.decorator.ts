import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
  ApiOperation,
} from '@nestjs/swagger';
import { STATUS_CODES } from 'http';
import { PagedResponseDto } from '../dtos/paged-response.dto';

const SUMMARY_PAGED = 'Obtener registros paginados';

export function ApiGetPagedDoc(dto: Type<unknown>, resourceName?: string) {
  const summary = SUMMARY_PAGED + (resourceName ? ` del ${resourceName}` : '');

  return applyDecorators(
    ApiOperation({ summary }),

    ApiExtraModels(PagedResponseDto, dto),
    ApiOkResponse({
      description: STATUS_CODES[HttpStatus.OK],
      schema: {
        allOf: [
          { $ref: getSchemaPath(PagedResponseDto) },
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
