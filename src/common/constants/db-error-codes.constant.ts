import { HttpStatus } from '@nestjs/common';

export interface DbErrorMapping {
  statusCode: HttpStatus;
  message: string;
  prodError: string;
}

export const DB_ERROR_CODES: Record<string, DbErrorMapping> = {
  '23505': {
    statusCode: HttpStatus.CONFLICT,
    message: 'El registro ya existe o viola una restricción de duplicados',
    prodError: 'Conflict',
  },
  '23503': {
    statusCode: HttpStatus.BAD_REQUEST,
    message:
      'No se puede procesar la solicitud porque la entidad relacionada no existe o está vinculada',
    prodError: 'Bad Request',
  },
  '23502': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Faltan campos obligatorios en la base de datos',
    prodError: 'Bad Request',
  },
  '22P02': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'El valor enviado no es válido para el tipo de dato esperado',
    prodError: 'Bad Request',
  },
  '22001': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'El valor excede la longitud máxima permitida',
    prodError: 'Bad Request',
  },
  '23514': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'El valor viola una restricción de validación',
    prodError: 'Bad Request',
  },
};

export const DEFAULT_DB_ERROR: DbErrorMapping = {
  statusCode: HttpStatus.BAD_REQUEST,
  message: 'Error en la consulta de base de datos',
  prodError: 'Bad Request',
};
