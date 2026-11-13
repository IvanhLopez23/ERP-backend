import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { PublicResponseInterceptor } from './common/interceptors/public-response.interceptor';
import { UploadedFileCleanupInterceptor } from './common/interceptors/uploaded-file-cleanup.interceptor';
import { ActionLogInterceptor } from './common/interceptors/action-log.interceptor';
import {
  CatalogDto,
  CreateResponseDto,
  DeleteResponseDto,
  ErrorResponseDto,
  GetResponseDto,
  PagedResponseDto,
  UpdateResponseDto,
} from './common/dtos';
import { buildErrorExample } from './common/decorators/api-error-responses.decorator';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(
    app.get(ActionLogInterceptor),
    new UploadedFileCleanupInterceptor(),
    new PublicResponseInterceptor(),
  );

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const config = new DocumentBuilder()
    .setTitle('API de ERP')
    .setDescription('Documentación interactiva de la API con autenticación JWT')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [
      CatalogDto,
      CreateResponseDto,
      DeleteResponseDto,
      ErrorResponseDto,
      GetResponseDto,
      PagedResponseDto,
      UpdateResponseDto,
    ],
  });
  sanitizeSwaggerIdentifiers(document);
  completeSwaggerOperations(document);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'API ERP',
  });

  await app.listen(process.env.PORT || 3001);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT}/api`,
  );
  console.log(
    `Swagger documentation available on: http://localhost:${process.env.PORT}/api/docs`,
  );
}

function sanitizeSwaggerIdentifiers(document: Record<string, any>) {
  const schemas = document.components?.schemas as
    Record<string, any> | undefined;
  if (!schemas) return;

  for (const [schemaName, schema] of Object.entries(schemas)) {
    if (!schema?.properties) continue;

    const isRequestDto =
      (schemaName.startsWith('Create') || schemaName.startsWith('Update')) &&
      !schemaName.includes('Response');
    if (isRequestDto) continue;

    const properties = schema.properties as Record<string, any>;
    const required = new Set<string>(schema.required || []);

    for (const key of Object.keys(properties)) {
      if (key === 'id') {
        delete properties[key];
        required.delete(key);
        continue;
      }

      if (!key.endsWith('Id') || key === 'publicId') continue;
      const publicKey = `${key.slice(0, -2)}PublicId`;
      properties[publicKey] = { type: 'string', format: 'uuid' };
      delete properties[key];
      if (required.has(key)) {
        required.delete(key);
        required.add(publicKey);
      }
    }

    if (required.size > 0) schema.required = [...required];
    else delete schema.required;
  }

  for (const [path, pathItem] of Object.entries(document.paths || {})) {
    if (!path.includes('{publicId}')) continue;
    for (const operation of Object.values(pathItem as Record<string, any>)) {
      if (
        !operation ||
        typeof operation !== 'object' ||
        !('responses' in operation)
      )
        continue;
      operation.parameters ||= [];
      if (
        !operation.parameters.some(
          (parameter: any) => parameter.name === 'publicId',
        )
      ) {
        operation.parameters.push({
          name: 'publicId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        });
      }
    }
  }
}

function completeSwaggerOperations(document: Record<string, any>) {
  const errorStatuses = [400, 401, 403, 404, 409, 500];

  for (const [path, pathItem] of Object.entries(document.paths || {})) {
    for (const [method, operation] of Object.entries(
      pathItem as Record<string, any>,
    )) {
      if (
        !operation ||
        typeof operation !== 'object' ||
        !('responses' in operation)
      ) {
        continue;
      }

      operation.summary ||= `${String(method).toUpperCase()} ${path}`;
      operation.responses ||= {};
      for (const status of errorStatuses) {
        if (operation.responses[status]) continue;
        operation.responses[status] = {
          description: STATUS_DESCRIPTIONS[status],
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponseDto' },
              example: buildErrorExample(status),
            },
          },
        };
      }

      for (const parameterName of path.matchAll(/\{([^}]+)\}/g)) {
        const name = parameterName[1];
        operation.parameters ||= [];
        if (
          operation.parameters.some((parameter: any) => parameter.name === name)
        ) {
          continue;
        }
        const isPublicId = name === 'publicId' || name.endsWith('PublicId');
        operation.parameters.push({
          name,
          in: 'path',
          required: true,
          schema: isPublicId
            ? { type: 'string', format: 'uuid' }
            : { type: 'string' },
        });
      }
    }
  }
}

const STATUS_DESCRIPTIONS: Record<number, string> = {
  400: 'Solicitud inválida',
  401: 'No autenticado',
  403: 'Sin permisos',
  404: 'Recurso no encontrado',
  409: 'Conflicto',
  500: 'Error interno del servidor',
};
bootstrap();
