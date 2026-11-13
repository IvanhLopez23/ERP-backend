import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';
import { UsuariosService } from '../../modules/usuarios/usuarios.service';
import { PUBLIC_ID_PATTERN } from '../validation/public-id';
import { CORS_ORIGIN_OPTION, esOrigenPermitido } from './cors.config';

interface SocketUser {
  sub: string;
  publicId?: string;
  rolPublicId?: string;
  internalId?: number;
  internalRoleId?: number;
  nombreUsuario?: string;
  scope?: string;
}

@WebSocketGateway({
  cors: { origin: CORS_ORIGIN_OPTION },
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly socketService: SocketService,
    private readonly usuariosService: UsuariosService,
  ) {}

  afterInit(server: Server) {
    this.socketService.setServer(server);

    server.use((socket, next) => {
      void this.autenticarSocket(socket, next);
    });
  }

  private async autenticarSocket(
    socket: Socket,
    next: (error?: Error) => void,
  ) {
    try {
      if (!esOrigenPermitido(socket.handshake.headers.origin)) {
        return next(new Error('origin_not_allowed'));
      }

      const token = this.extraerToken(socket);
      if (!token) return next(new Error('unauthorized'));

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (
        payload?.scope &&
        payload.scope !== 'ws' &&
        payload.scope !== 'access'
      ) {
        return next(new Error('unauthorized'));
      }

      const publicId = payload?.sub;
      if (typeof publicId !== 'string' || !PUBLIC_ID_PATTERN.test(publicId)) {
        return next(new Error('unauthorized'));
      }

      const usuario = await this.usuariosService.buscarPorId(publicId);
      if (!usuario?.activo || !usuario.rol?.activo) {
        return next(new Error('unauthorized'));
      }

      socket.data.user = {
        ...payload,
        publicId: usuario.publicId,
        internalId: usuario.id,
        internalRoleId: usuario.rolId,
        rolPublicId: usuario.rol?.publicId,
      } satisfies SocketUser;

      next();
    } catch {
      next(new Error('unauthorized'));
    }
  }

  handleConnection(socket: Socket) {
    const user = socket.data.user as SocketUser | undefined;
    if (!user?.sub) {
      socket.disconnect(true);
      return;
    }

    void socket.join(`user:${user.sub}`);
    if (user.rolPublicId) {
      void socket.join(`rol:${user.rolPublicId}`);
    }
  }

  handleDisconnect() {}

  private extraerToken(socket: Socket): string | undefined {
    const auth = socket.handshake.auth as { token?: unknown } | undefined;
    if (typeof auth?.token === 'string' && auth.token.length > 0) {
      return auth.token;
    }

    // Compatibilidad con clientes Node/Electron, pruebas y proxies.
    const header = socket.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return undefined;
  }

  @SubscribeMessage('join:grupo')
  handleJoinGrupo(client: Socket, payload: { grupo: string }) {
    if (payload?.grupo) {
      void client.join(`grupo:${payload.grupo}`);
    }
  }

  @SubscribeMessage('leave:grupo')
  handleLeaveGrupo(client: Socket, payload: { grupo: string }) {
    if (payload?.grupo) {
      void client.leave(`grupo:${payload.grupo}`);
    }
  }
}
