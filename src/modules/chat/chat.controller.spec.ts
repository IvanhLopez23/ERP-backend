import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { ChatController } from './chat.controller';
import type { ChatService } from './chat.service';

const USER_ID = '0199a000-0000-7000-8000-000000000010';
const ROLE_ID = '0199a000-0000-7000-8000-000000000020';

describe('ChatController — ws-ticket', () => {
  const chatService = {};
  const jwtService = { signAsync: jest.fn() };
  const configService = { get: jest.fn(() => '60') };

  let controller: ChatController;

  beforeEach(() => {
    jest.clearAllMocks();
    jwtService.signAsync.mockResolvedValue('ticket-firmado');
    controller = new ChatController(
      chatService as unknown as ChatService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it('emite un ticket de 60 segundos con scope ws', async () => {
    const resultado = await controller.emitirTicketWs({
      sub: USER_ID,
      rolId: ROLE_ID,
      nombreUsuario: 'admin',
    });

    expect(resultado).toEqual({
      token: 'ticket-firmado',
      expiresIn: 60,
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        sub: USER_ID,
        rolPublicId: ROLE_ID,
        nombreUsuario: 'admin',
        scope: 'ws',
      },
      { expiresIn: 60 },
    );
  });

  it('rechaza la emisión si no hay usuario en la sesión', async () => {
    await expect(controller.emitirTicketWs({})).rejects.toThrow(
      UnauthorizedException,
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('usa 60 segundos si WS_TICKET_TTL es inválido', async () => {
    configService.get.mockReturnValue('no-numero');

    const resultado = await controller.emitirTicketWs({
      sub: USER_ID,
      rolId: ROLE_ID,
      nombreUsuario: 'admin',
    });

    expect(resultado.expiresIn).toBe(60);
  });
});
