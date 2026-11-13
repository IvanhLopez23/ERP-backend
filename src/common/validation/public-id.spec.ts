import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsPublicId, PublicIdPipe, PUBLIC_ID_PATTERN } from './public-id';

describe('public id validation', () => {
  it('accepts UUID v7 values', () => {
    const value = '0199a000-0000-7000-8000-000000000001';
    expect(PUBLIC_ID_PATTERN.test(value)).toBe(true);
    expect(new PublicIdPipe().transform(value)).toBe(value);
  });

  it('rejects UUID v4 and malformed values', () => {
    expect(() =>
      new PublicIdPipe().transform('550e8400-e29b-41d4-a716-446655440000'),
    ).toThrow(BadRequestException);
    expect(() => new PublicIdPipe().transform('15')).toThrow(
      BadRequestException,
    );
  });

  it('exposes a class-validator decorator', () => {
    class RequestDto {
      @IsPublicId()
      publicId: string;
    }

    expect(
      validateSync(plainToInstance(RequestDto, { publicId: '15' })),
    ).not.toHaveLength(0);
    expect(
      validateSync(
        plainToInstance(RequestDto, {
          publicId: '0199a000-0000-7000-8000-000000000001',
        }),
      ),
    ).toHaveLength(0);
  });
});
