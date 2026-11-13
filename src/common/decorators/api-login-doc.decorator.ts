import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { STATUS_CODES } from 'http';

export function ApiLoginDoc(dto: Type<unknown>) {
  return applyDecorators(
    ApiOperation({ summary: `Login` }),

    ApiExtraModels(dto),
    ApiOkResponse({
      description: STATUS_CODES[HttpStatus.OK],
      schema: {
        $ref: getSchemaPath(dto),
      },
    }),
  );
}
