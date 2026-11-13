import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { registerDecorator, ValidationOptions } from 'class-validator';

export const PUBLIC_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function IsPublicId(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    registerDecorator({
      name: 'isPublicId',
      target: target.constructor,
      propertyName: propertyKey.toString(),
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && PUBLIC_ID_PATTERN.test(value);
        },
      },
    });
  };
}

@Injectable()
export class PublicIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!PUBLIC_ID_PATTERN.test(value)) {
      throw new BadRequestException('publicId debe ser un UUID v7 válido');
    }
    return value;
  }
}
