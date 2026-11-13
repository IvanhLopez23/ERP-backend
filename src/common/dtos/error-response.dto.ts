import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Sobre estándar de errores generado por AllExceptionsFilter.
 * correlationId = header X-Request-Id del request: úsalo para rastrear
 * la operación completa en GET /api/audit-trail.
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código HTTP del error',
  })
  statusCode: number;

  @ApiProperty({
    example:
      'El usuario no tiene permisos suficientes para realizar esta acción',
    description:
      'Mensaje legible. Puede ser arreglo cuando son errores de validación',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiPropertyOptional({
    example: 'Forbidden',
    description: 'Nombre corto del tipo de error',
  })
  error?: string;

  @ApiPropertyOptional({
    nullable: true,
    example: '7f3a9b2e-1c4d-4e5f-8a9b-2c3d4e5f6a7b',
    description:
      'Id de correlación de la operación. Coincide con el header X-Request-Id; ' +
      'búscalo en GET /api/audit-trail?correlationId=… para ver el detalle completo.',
  })
  correlationId?: string | null;
}
