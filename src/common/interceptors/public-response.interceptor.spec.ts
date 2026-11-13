import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { PublicResponseInterceptor } from './public-response.interceptor';

describe('PublicResponseInterceptor', () => {
  it('removes internal ids recursively while preserving publicId', async () => {
    const handler: CallHandler = {
      handle: () =>
        of({
          id: 15,
          publicId: '0199a000-0000-7000-8000-000000000001',
          rolId: 3,
          rol: { id: 3, publicId: '0199a000-0000-7000-8000-000000000002' },
        }),
    };

    const result = await firstValueFrom(
      new PublicResponseInterceptor().intercept(
        {} as ExecutionContext,
        handler,
      ),
    );

    expect(result).toEqual({
      publicId: '0199a000-0000-7000-8000-000000000001',
      rol: { publicId: '0199a000-0000-7000-8000-000000000002' },
    });
  });
});
