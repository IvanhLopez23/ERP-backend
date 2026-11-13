import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { STATUS_CODES } from 'http';
import { ErrorResponseDto } from '../dtos/error-response.dto';

export const CORRELATION_ID_EXAMPLE = '7f3a9b2e-1c4d-4e5f-8a9b-2c3d4e5f6a7b';

interface ErrorMeta {
  description: string;
  message: string;
}

const ERROR_META: Record<number, ErrorMeta> = {
  400: {
    description: 'Solicitud inválida (validaciones o reglas de negocio)',
    message: 'Los datos enviados no son válidos o violan una regla de negocio.',
  },
  401: {
    description:
      'No autenticado: token ausente, inválido, expirado o identidad ya no vigente',
    message: 'El usuario no está autenticado o su autenticación no es válida.',
  },
  403: {
    description: 'Sin permisos (RBAC) o rol/usuario inactivo',
    message:
      'El usuario no tiene permisos suficientes para realizar esta acción.',
  },
  404: {
    description: 'Recurso no encontrado',
    message: 'El recurso solicitado no fue encontrado.',
  },
  409: {
    description: 'Conflicto con el estado actual del recurso',
    message:
      'La operación entra en conflicto con el estado actual del recurso.',
  },
  500: {
    description: 'Error interno del servidor',
    message: 'Ocurrió un error interno en el servidor.',
  },
};

export function buildErrorExample(status: number) {
  return {
    statusCode: status,
    error: STATUS_CODES[status],
    message: ERROR_META[status]?.message ?? 'Error',
    correlationId: CORRELATION_ID_EXAMPLE,
  };
}

/**
 * Documenta en Swagger los sobres de error estándar (ErrorResponseDto,
 * incluyendo correlationId) para los códigos indicados. Úsalo a nivel de
 * clase para cubrir todos los endpoints del controller.
 *
 * Cada respuesta incluye su propio `statusCode` y mensaje de ejemplo, por lo
 * que Swagger mostrará el código correcto para cada error.
 *
 * Ejemplo: @ApiErrorResponses(400, 401, 403, 404, 500)
 */
export const ApiErrorResponses = (...statusCodes: number[]) =>
  applyDecorators(
    ...statusCodes.map((status) =>
      ApiResponse({
        status,
        description: ERROR_META[status]?.description ?? 'Error',
        type: ErrorResponseDto,
        example: buildErrorExample(status),
      }),
    ),
  );
