import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import type { UsuariosService } from '../../usuarios/usuarios.service';

const USER_ID = '0199a000-0000-7000-8000-000000000010';
const ROLE_ID = '0199a000-0000-7000-8000-000000000020';

describe('AuthGuard', () => {
  const jwtService = { verifyAsync: jest.fn() };
  const configService = { get: jest.fn(() => 'secret') };
  const usuariosService = { buscarPorId: jest.fn() };

  let guard: AuthGuard;
  let request: Record<string, any>;

  const context = () =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    request = { headers: { authorization: 'Bearer access-token' } };
    guard = new AuthGuard(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      usuariosService as unknown as UsuariosService,
    );
  });

  it('rechaza un ticket de WebSocket en endpoints REST', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: USER_ID, scope: 'ws' });

    await expect(guard.canActivate(context())).rejects.toThrow(
      UnauthorizedException,
    );
    expect(usuariosService.buscarPorId).not.toHaveBeenCalled();
  });

  it('acepta un access token normal y adjunta el usuario', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: USER_ID });
    usuariosService.buscarPorId.mockResolvedValue({
      id: 1,
      publicId: USER_ID,
      activo: true,
      rolId: 2,
      rol: { activo: true, publicId: ROLE_ID },
    });

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(request.user).toMatchObject({
      sub: USER_ID,
      internalId: 1,
      internalRoleId: 2,
    });
  });

  it('rechaza un token inválido', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    await expect(guard.canActivate(context())).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
