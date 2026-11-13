import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { catchError, from, mergeMap, Observable, throwError } from 'rxjs';
import { Repository } from 'typeorm';
import { Auditoria } from '../../modules/auditoria/entities/auditoria.entity';

const SENSITIVE_KEYS = new Set([
  'password',
  'contrasena',
  'token',
  'refreshToken',
  'authorization',
  'cookie',
  'emailPass',
]);
const MAX_VALUE_LENGTH = 10000;

@Injectable()
export class ActionLogInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Auditoria)
    private readonly repository: Repository<Auditoria>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const startedAt = Date.now();
    if (request.method === 'GET') {
      return next.handle();
    }

    const requestUser = request.user as { internalId?: number } | undefined;
    const endpoint = request.route?.path || request.path || request.url;

    const logResult = (
      payload: unknown,
      statusCode: number,
      exitoso: boolean,
    ) =>
      from(
        this.safeSave({
          usuarioId: requestUser?.internalId,
          metodo: request.method,
          endpoint,
          parametros: this.sanitize({
            params: request.params,
            query: request.query,
          }) as Record<string, unknown>,
          body: this.sanitize(request.body),
          respuesta: this.sanitize(payload),
          statusCode,
          duracionMs: Date.now() - startedAt,
          ip: request.ip,
          userAgent: request.get('user-agent'),
          exitoso,
        }),
      );

    return next.handle().pipe(
      mergeMap((payload) =>
        logResult(payload, Number(response.statusCode) || 200, true).pipe(
          mergeMap(() => from([payload])),
        ),
      ),
      catchError((error: unknown) => {
        const statusCode =
          typeof (error as { getStatus?: () => number })?.getStatus ===
          'function'
            ? (error as { getStatus: () => number }).getStatus()
            : 500;
        return logResult(
          error instanceof Error ? { message: error.message } : error,
          statusCode,
          false,
        ).pipe(mergeMap(() => throwError(() => error)));
      }),
    );
  }

  private async safeSave(data: Partial<Auditoria>) {
    try {
      await this.repository.save(this.repository.create(data));
    } catch {
      // El log de auditoría es mejor esfuerzo; nunca debe romper la petición.
    }
  }

  private sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return value.slice(0, MAX_VALUE_LENGTH);
    if (typeof value !== 'object') return value;
    if (value instanceof Buffer) return { type: 'buffer', size: value.length };
    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    if (Array.isArray(value)) {
      return value.slice(0, 100).map((item) => this.sanitize(item, seen));
    }

    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key) || key.toLowerCase().includes('password')) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = this.sanitize(item, seen);
      }
    }
    return result;
  }
}
