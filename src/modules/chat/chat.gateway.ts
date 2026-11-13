import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { PUBLIC_ID_PATTERN } from '../../common/validation/public-id';
import { serializePublicResponse } from '../../common/interceptors/public-response.interceptor';
import { CORS_ORIGIN_OPTION } from '../../common/sockets/cors.config';

const MAX_CONTENIDO = 2000;
const MAX_MENSAJES = 10;
const VENTANA_RATE_LIMIT_MS = 10_000;

interface SocketUser {
  internalId?: number;
  publicId?: string;
  sub?: string;
  nombreUsuario?: string;
}

@WebSocketGateway({
  cors: { origin: CORS_ORIGIN_OPTION },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private readonly enviosPorSocket = new WeakMap<Socket, number[]>();

  constructor(private readonly chatService: ChatService) {}

  private consumirLimite(client: Socket): boolean {
    const ahora = Date.now();
    const recientes = (this.enviosPorSocket.get(client) ?? []).filter(
      (timestamp) => ahora - timestamp < VENTANA_RATE_LIMIT_MS,
    );

    if (recientes.length >= MAX_MENSAJES) {
      this.enviosPorSocket.set(client, recientes);
      return false;
    }

    recientes.push(ahora);
    this.enviosPorSocket.set(client, recientes);
    return true;
  }

  private obtenerUsuario(client: Socket): SocketUser {
    return (client.data.user ?? {}) as SocketUser;
  }

  private esPublicId(value: unknown): value is string {
    return typeof value === 'string' && PUBLIC_ID_PATTERN.test(value);
  }

  private soloClaves(payload: unknown, claves: string[]): boolean {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return false;
    }
    return Object.keys(payload as Record<string, unknown>).every((clave) =>
      claves.includes(clave),
    );
  }

  private emitError(client: Socket, code: string, message: string) {
    client.emit('chat:error', { code, message });
  }

  @SubscribeMessage('chat:join')
  async handleJoinConversacion(
    client: Socket,
    payload: { conversacionPublicId: string },
  ) {
    const usuario = this.obtenerUsuario(client);
    if (!usuario.internalId) {
      return this.emitError(
        client,
        'no_autenticado',
        'No hay una sesión autenticada.',
      );
    }

    const conversacionPublicId = payload?.conversacionPublicId;
    if (
      !this.soloClaves(payload, ['conversacionPublicId']) ||
      !this.esPublicId(conversacionPublicId)
    ) {
      return this.emitError(
        client,
        'payload_invalido',
        'conversacionPublicId debe ser un UUID v7 válido.',
      );
    }

    try {
      const conversacionId =
        await this.chatService.resolverConversacion(conversacionPublicId);
      await this.chatService.validarParticipante(
        conversacionId,
        usuario.internalId,
      );
      await client.join(`conversacion:${conversacionId}`);
      client.emit('chat:joined', { conversacionPublicId });
    } catch {
      this.emitError(
        client,
        'sin_acceso',
        'No tienes acceso a esta conversación.',
      );
    }
  }

  @SubscribeMessage('chat:leave')
  async handleLeaveConversacion(
    client: Socket,
    payload: { conversacionPublicId: string },
  ) {
    const conversacionPublicId = payload?.conversacionPublicId;
    if (
      !this.soloClaves(payload, ['conversacionPublicId']) ||
      !this.esPublicId(conversacionPublicId)
    ) {
      return this.emitError(
        client,
        'payload_invalido',
        'conversacionPublicId debe ser un UUID v7 válido.',
      );
    }

    try {
      const conversacionId =
        await this.chatService.resolverConversacion(conversacionPublicId);
      await client.leave(`conversacion:${conversacionId}`);
    } catch {
      // Salir de una sala inexistente es inocuo; no se notifica al cliente.
    }
  }

  @SubscribeMessage('chat:send')
  async handleSend(
    client: Socket,
    payload: { conversacionPublicId: string; contenido: string },
  ) {
    const usuario = this.obtenerUsuario(client);
    if (!usuario.internalId) {
      return this.emitError(
        client,
        'no_autenticado',
        'No hay una sesión autenticada.',
      );
    }

    const conversacionPublicId = payload?.conversacionPublicId;
    const contenido =
      typeof payload?.contenido === 'string' ? payload.contenido.trim() : '';
    if (
      !this.soloClaves(payload, ['conversacionPublicId', 'contenido']) ||
      !this.esPublicId(conversacionPublicId) ||
      contenido.length < 1 ||
      contenido.length > MAX_CONTENIDO
    ) {
      return this.emitError(
        client,
        'payload_invalido',
        `El mensaje debe tener entre 1 y ${MAX_CONTENIDO} caracteres y una conversación válida.`,
      );
    }

    if (!this.consumirLimite(client)) {
      return this.emitError(
        client,
        'rate_limited',
        'Demasiados mensajes. Espera unos segundos antes de enviar otro.',
      );
    }

    try {
      const conversacionId =
        await this.chatService.resolverConversacion(conversacionPublicId);
      const mensaje = await this.chatService.enviarMensaje(
        usuario.internalId,
        conversacionId,
        contenido,
      );

      this.server.to(`conversacion:${conversacionId}`).emit('chat:mensaje', {
        conversacionPublicId,
        mensaje: serializePublicResponse(mensaje),
      });
    } catch {
      this.emitError(
        client,
        'sin_acceso',
        'No tienes acceso a esta conversación.',
      );
    }
  }

  @SubscribeMessage('chat:typing')
  async handleTyping(
    client: Socket,
    payload: { conversacionPublicId: string },
  ) {
    const usuario = this.obtenerUsuario(client);
    if (!usuario.internalId) {
      return this.emitError(
        client,
        'no_autenticado',
        'No hay una sesión autenticada.',
      );
    }

    const conversacionPublicId = payload?.conversacionPublicId;
    if (
      !this.soloClaves(payload, ['conversacionPublicId']) ||
      !this.esPublicId(conversacionPublicId)
    ) {
      return this.emitError(
        client,
        'payload_invalido',
        'conversacionPublicId debe ser un UUID v7 válido.',
      );
    }

    try {
      const conversacionId =
        await this.chatService.resolverConversacion(conversacionPublicId);
      await this.chatService.validarParticipante(
        conversacionId,
        usuario.internalId,
      );

      client.to(`conversacion:${conversacionId}`).emit('chat:typing', {
        conversacionPublicId,
        usuarioPublicId: usuario.publicId ?? usuario.sub,
        nombreUsuario: usuario.nombreUsuario,
      });
    } catch {
      this.emitError(
        client,
        'sin_acceso',
        'No tienes acceso a esta conversación.',
      );
    }
  }

  @SubscribeMessage('chat:read')
  async handleRead(
    client: Socket,
    payload: { conversacionPublicId: string; mensajePublicId: string },
  ) {
    const usuario = this.obtenerUsuario(client);
    if (!usuario.internalId) {
      return this.emitError(
        client,
        'no_autenticado',
        'No hay una sesión autenticada.',
      );
    }

    const conversacionPublicId = payload?.conversacionPublicId;
    const mensajePublicId = payload?.mensajePublicId;
    if (
      !this.soloClaves(payload, ['conversacionPublicId', 'mensajePublicId']) ||
      !this.esPublicId(conversacionPublicId) ||
      !this.esPublicId(mensajePublicId)
    ) {
      return this.emitError(
        client,
        'payload_invalido',
        'conversacionPublicId y mensajePublicId deben ser UUID v7 válidos.',
      );
    }

    try {
      const conversacionId =
        await this.chatService.resolverConversacion(conversacionPublicId);
      const mensajeId = await this.chatService.resolverMensaje(mensajePublicId);

      await this.chatService.marcarComoLeido(
        usuario.internalId,
        conversacionId,
        mensajeId,
      );

      client.to(`conversacion:${conversacionId}`).emit('chat:leido', {
        conversacionPublicId,
        usuarioPublicId: usuario.publicId ?? usuario.sub,
        mensajePublicId,
      });
    } catch {
      this.emitError(
        client,
        'sin_acceso',
        'No tienes acceso a esta conversación.',
      );
    }
  }
}
