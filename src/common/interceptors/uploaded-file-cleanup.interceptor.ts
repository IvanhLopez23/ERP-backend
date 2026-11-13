import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { catchError, Observable, throwError } from 'rxjs';
import type { Request } from 'express';

type RequestWithFiles = Request & {
  file?: Express.Multer.File;
  files?:
    Express.Multer.File[] | Record<string, Express.Multer.File[]> | undefined;
};

/**
 * Si la petición termina en error, elimina de disco los archivos que
 * multer ya había guardado. Así una operación fallida no deja fotos huérfanas.
 * En peticiones sin archivo (o exitosas) no hace nada.
 */
@Injectable()
export class UploadedFileCleanupInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithFiles>();
    return next.handle().pipe(
      catchError((error: unknown) => {
        this.eliminarSubidos(request);
        return throwError(() => error);
      }),
    );
  }

  private eliminarSubidos(request: RequestWithFiles) {
    const archivos: Express.Multer.File[] = [];
    if (request.file) archivos.push(request.file);
    if (Array.isArray(request.files)) {
      archivos.push(...request.files);
    } else if (request.files && typeof request.files === 'object') {
      for (const valor of Object.values(request.files)) {
        if (Array.isArray(valor)) archivos.push(...valor);
      }
    }
    for (const archivo of archivos) {
      const ruta = archivo?.path;
      if (ruta && existsSync(ruta)) {
        try {
          unlinkSync(ruta);
        } catch {
          // El borrado es mejor esfuerzo; nunca debe ocultar el error original.
        }
      }
    }
  }
}
