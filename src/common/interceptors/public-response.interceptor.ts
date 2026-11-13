import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { PUBLIC_ID_PATTERN } from '../validation/public-id';

export function serializePublicResponse(value: unknown): unknown {
  if (value instanceof Date || value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(serializePublicResponse);
  }

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(source)) {
    if (key === 'id') {
      continue;
    }
    if (key.endsWith('Id') && key !== 'publicId') {
      if (typeof item !== 'string' || !PUBLIC_ID_PATTERN.test(item)) continue;
    }

    result[key] = serializePublicResponse(item);
  }

  return result;
}

@Injectable()
export class PublicResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map(serializePublicResponse));
  }
}
