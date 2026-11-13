import { ForbiddenException } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';
import type { ChatService } from './chat.service';

const CONV_ID = '0199a000-0000-7000-8000-000000000001';
const MSG_ID = '0199a000-0000-7000-8000-000000000002';

const usuario = {
  internalId: 1,
  sub: '0199a000-0000-7000-8000-000000000010',
  publicId: '0199a000-0000-7000-8000-000000000010',
  nombreUsuario: 'admin',
};

describe('ChatGateway — autorización de eventos', () => {
  const chatService = {
    resolverConversacion: jest.fn(),
    validarParticipante: jest.fn(),
    enviarMensaje: jest.fn(),
    resolverMensaje: jest.fn(),
    marcarComoLeido: jest.fn(),
  };

  let gateway: ChatGateway;
  let serverEmit: jest.Mock;
  let toEmit: jest.Mock;

  const crearSocket = (user: Record<string, unknown> | null = usuario) => {
    const emit = jest.fn();
    const join = jest.fn();
    const leave = jest.fn();
    const to = jest.fn(() => ({ emit: toEmit }));
    return {
      data: { user },
      emit,
      join,
      leave,
      to,
      disconnect: jest.fn(),
    };
  };

  const emitir = (client: ReturnType<typeof crearSocket>) =>
    client as unknown as Socket;

  beforeEach(() => {
    jest.clearAllMocks();
    serverEmit = jest.fn();
    toEmit = jest.fn();
    gateway = new ChatGateway(chatService as unknown as ChatService);
    gateway.server = {
      to: jest.fn(() => ({ emit: serverEmit })),
    } as unknown as Server;
  });

  describe('chat:join', () => {
    it('permite entrar a una conversación si el usuario es participante', async () => {
      chatService.resolverConversacion.mockResolvedValue(10);
      chatService.validarParticipante.mockResolvedValue({});
      const socket = crearSocket();

      await gateway.handleJoinConversacion(emitir(socket), {
        conversacionPublicId: CONV_ID,
      });

      expect(chatService.validarParticipante).toHaveBeenCalledWith(10, 1);
      expect(socket.join).toHaveBeenCalledWith('conversacion:10');
      expect(socket.emit).toHaveBeenCalledWith('chat:joined', {
        conversacionPublicId: CONV_ID,
      });
    });

    it('rechaza entrar a una conversación ajena', async () => {
      chatService.resolverConversacion.mockResolvedValue(10);
      chatService.validarParticipante.mockRejectedValue(
        new ForbiddenException(),
      );
      const socket = crearSocket();

      await gateway.handleJoinConversacion(emitir(socket), {
        conversacionPublicId: CONV_ID,
      });

      expect(socket.join).not.toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith(
        'chat:error',
        expect.objectContaining({ code: 'sin_acceso' }),
      );
    });

    it('rechaza si no hay usuario autenticado', async () => {
      const socket = crearSocket(null);

      await gateway.handleJoinConversacion(emitir(socket), {
        conversacionPublicId: CONV_ID,
      });

      expect(socket.emit).toHaveBeenCalledWith(
        'chat:error',
        expect.objectContaining({ code: 'no_autenticado' }),
      );
      expect(chatService.resolverConversacion).not.toHaveBeenCalled();
    });

    it('rechaza un conversacionPublicId inválido', async () => {
      const socket = crearSocket();

      await gateway.handleJoinConversacion(emitir(socket), {
        conversacionPublicId: 'no-es-uuid',
      });

      expect(socket.emit).toHaveBeenCalledWith(
        'chat:error',
        expect.objectContaining({ code: 'payload_invalido' }),
      );
      expect(chatService.resolverConversacion).not.toHaveBeenCalled();
    });
  });

  describe('chat:typing', () => {
    it('emite typing solo si el usuario es participante', async () => {
      chatService.resolverConversacion.mockResolvedValue(10);
      chatService.validarParticipante.mockResolvedValue({});
      const socket = crearSocket();

      await gateway.handleTyping(emitir(socket), {
        conversacionPublicId: CONV_ID,
      });

      expect(socket.to).toHaveBeenCalledWith('conversacion:10');
      expect(toEmit).toHaveBeenCalledWith(
        'chat:typing',
        expect.objectContaining({
          conversacionPublicId: CONV_ID,
          nombreUsuario: 'admin',
        }),
      );
    });

    it('no emite typing a conversaciones ajenas', async () => {
      chatService.resolverConversacion.mockResolvedValue(10);
      chatService.validarParticipante.mockRejectedValue(
        new ForbiddenException(),
      );
      const socket = crearSocket();

      await gateway.handleTyping(emitir(socket), {
        conversacionPublicId: CONV_ID,
      });

      expect(socket.to).not.toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith(
        'chat:error',
        expect.objectContaining({ code: 'sin_acceso' }),
      );
    });
  });

  describe('chat:send', () => {
    it('normaliza el contenido y emite el mensaje a la sala', async () => {
      chatService.resolverConversacion.mockResolvedValue(10);
      chatService.enviarMensaje.mockResolvedValue({
        id: 1,
        publicId: MSG_ID,
        contenido: 'hola',
      });
      const socket = crearSocket();

      await gateway.handleSend(emitir(socket), {
        conversacionPublicId: CONV_ID,
        contenido: '  hola  ',
      });

      expect(chatService.enviarMensaje).toHaveBeenCalledWith(1, 10, 'hola');
      expect(serverEmit).toHaveBeenCalledWith(
        'chat:mensaje',
        expect.objectContaining({ conversacionPublicId: CONV_ID }),
      );
    });

    it('rechaza contenido vacío sin llamar al servicio', async () => {
      const socket = crearSocket();

      await gateway.handleSend(emitir(socket), {
        conversacionPublicId: CONV_ID,
        contenido: '   ',
      });

      expect(chatService.enviarMensaje).not.toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith(
        'chat:error',
        expect.objectContaining({ code: 'payload_invalido' }),
      );
    });

    it('limita a 10 mensajes por ventana de 10 segundos', async () => {
      chatService.resolverConversacion.mockResolvedValue(10);
      chatService.enviarMensaje.mockResolvedValue({
        publicId: MSG_ID,
        contenido: 'hola',
      });
      const socket = crearSocket();

      for (let i = 0; i < 10; i++) {
        await gateway.handleSend(emitir(socket), {
          conversacionPublicId: CONV_ID,
          contenido: `mensaje ${i}`,
        });
      }

      await gateway.handleSend(emitir(socket), {
        conversacionPublicId: CONV_ID,
        contenido: 'mensaje 11',
      });

      expect(chatService.enviarMensaje).toHaveBeenCalledTimes(10);
      expect(socket.emit).toHaveBeenCalledWith(
        'chat:error',
        expect.objectContaining({ code: 'rate_limited' }),
      );
    });

    it('no emite mensaje si el usuario no es participante', async () => {
      chatService.resolverConversacion.mockResolvedValue(10);
      chatService.enviarMensaje.mockRejectedValue(new ForbiddenException());
      const socket = crearSocket();

      await gateway.handleSend(emitir(socket), {
        conversacionPublicId: CONV_ID,
        contenido: 'hola',
      });

      expect(serverEmit).not.toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith(
        'chat:error',
        expect.objectContaining({ code: 'sin_acceso' }),
      );
    });

    it('rechaza campos extra en el payload', async () => {
      const socket = crearSocket();

      await gateway.handleSend(emitir(socket), {
        conversacionPublicId: CONV_ID,
        contenido: 'hola',
        extra: 'no permitido',
      } as unknown as { conversacionPublicId: string; contenido: string });

      expect(chatService.enviarMensaje).not.toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith(
        'chat:error',
        expect.objectContaining({ code: 'payload_invalido' }),
      );
    });
  });

  describe('chat:read', () => {
    it('rechaza marcar como leído en una conversación ajena', async () => {
      chatService.resolverConversacion.mockResolvedValue(10);
      chatService.resolverMensaje.mockResolvedValue(20);
      chatService.marcarComoLeido.mockRejectedValue(new ForbiddenException());
      const socket = crearSocket();

      await gateway.handleRead(emitir(socket), {
        conversacionPublicId: CONV_ID,
        mensajePublicId: MSG_ID,
      });

      expect(socket.to).not.toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith(
        'chat:error',
        expect.objectContaining({ code: 'sin_acceso' }),
      );
    });
  });
});
