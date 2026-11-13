import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { SocketGateway } from './socket.gateway';
import type { SocketService } from './socket.service';
import type { UsuariosService } from '../../modules/usuarios/usuarios.service';

const USER_ID = '0199a000-0000-7000-8000-000000000010';
const ROLE_ID = '0199a000-0000-7000-8000-000000000020';

interface FakeSocket {
  handshake: { auth: Record<string, unknown>; headers: Record<string, string> };
  data: Record<string, unknown>;
}

type Middleware = (socket: FakeSocket, next: (error?: Error) => void) => void;

describe('SocketGateway — autenticación del handshake', () => {
  const jwtService = { verifyAsync: jest.fn() };
  const configService = { get: jest.fn(() => 'secret') };
  const socketService = { setServer: jest.fn() };
  const usuariosService = { buscarPorId: jest.fn() };

  let gateway: SocketGateway;
  let middleware!: Middleware;

  const usuarioActivo = {
    id: 1,
    publicId: USER_ID,
    activo: true,
    rolId: 2,
    rol: { activo: true, publicId: ROLE_ID },
  };

  const ejecutarMiddleware = async (socket: FakeSocket) => {
    const next = jest.fn();
    const terminado = new Promise<void>((resolve) => {
      next.mockImplementation(() => resolve());
    });
    middleware(socket, next);
    await terminado;
    return next;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new SocketGateway(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      socketService as unknown as SocketService,
      usuariosService as unknown as UsuariosService,
    );

    const server = {
      use: jest.fn((fn) => {
        middleware = fn as Middleware;
      }),
    };
    gateway.afterInit(server as unknown as Server);
  });

  it('rechaza la conexión sin token', async () => {
    const socket: FakeSocket = {
      handshake: { auth: {}, headers: {} },
      data: {},
    };

    const next = await ejecutarMiddleware(socket);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(socket.data.user).toBeUndefined();
  });

  it('acepta un ticket WS y normaliza el usuario desde la BD', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: USER_ID, scope: 'ws' });
    usuariosService.buscarPorId.mockResolvedValue(usuarioActivo);

    const socket: FakeSocket = {
      handshake: { auth: { token: 'ws-ticket' }, headers: {} },
      data: {},
    };

    const next = await ejecutarMiddleware(socket);

    expect(next).toHaveBeenCalledWith();
    expect(socket.data.user).toMatchObject({
      sub: USER_ID,
      publicId: USER_ID,
      internalId: 1,
      rolPublicId: ROLE_ID,
      scope: 'ws',
    });
  });

  it('mantiene compatibilidad con el header Authorization', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: USER_ID });
    usuariosService.buscarPorId.mockResolvedValue(usuarioActivo);

    const socket: FakeSocket = {
      handshake: {
        auth: {},
        headers: { authorization: 'Bearer access-token' },
      },
      data: {},
    };

    const next = await ejecutarMiddleware(socket);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('access-token', {
      secret: 'secret',
    });
    expect(next).toHaveBeenCalledWith();
  });

  it('rechaza un scope distinto de ws/access', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: USER_ID,
      scope: 'refresh',
    });

    const socket: FakeSocket = {
      handshake: { auth: { token: 'refresh-token' }, headers: {} },
      data: {},
    };

    const next = await ejecutarMiddleware(socket);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(usuariosService.buscarPorId).not.toHaveBeenCalled();
  });

  it('rechaza usuarios o roles inactivos', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: USER_ID, scope: 'ws' });
    usuariosService.buscarPorId.mockResolvedValue({
      ...usuarioActivo,
      activo: false,
    });

    const socket: FakeSocket = {
      handshake: { auth: { token: 'ws-ticket' }, headers: {} },
      data: {},
    };

    const next = await ejecutarMiddleware(socket);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(socket.data.user).toBeUndefined();
  });

  it('rechaza un origen no permitido antes de validar el token', async () => {
    const socket: FakeSocket = {
      handshake: {
        auth: { token: 'ws-ticket' },
        headers: { origin: 'http://evil.com' },
      },
      data: {},
    };

    const next = await ejecutarMiddleware(socket);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('acepta un origen incluido en CORS_ORIGINS', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: USER_ID, scope: 'ws' });
    usuariosService.buscarPorId.mockResolvedValue(usuarioActivo);

    const socket: FakeSocket = {
      handshake: {
        auth: { token: 'ws-ticket' },
        headers: { origin: 'http://localhost:3000' },
      },
      data: {},
    };

    const next = await ejecutarMiddleware(socket);

    expect(next).toHaveBeenCalledWith();
  });

  it('une las salas user y rol después de autenticar', () => {
    const socket = {
      data: { user: { sub: USER_ID, rolPublicId: ROLE_ID } },
      join: jest.fn(),
      disconnect: jest.fn(),
    };

    gateway.handleConnection(socket as unknown as Socket);

    expect(socket.join).toHaveBeenCalledWith(`user:${USER_ID}`);
    expect(socket.join).toHaveBeenCalledWith(`rol:${ROLE_ID}`);
  });
});
