import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { PublicIdPipe } from 'src/common/validation/public-id';
import { ChatService } from './chat.service';
import { CrearConversacionDto } from './dto/crear-conversacion.dto';
import { AgregarParticipanteDto } from './dto/agregar-participante.dto';
import { BuscarMensajesDto } from './dto/buscar-mensajes.dto';
import { ConversacionResponseDto } from './dto/conversacion.response.dto';
import { ConversacionParticipanteResponseDto } from './dto/conversacion-participante.response.dto';
import { MensajeResponseDto } from './dto/mensaje.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiDeleteDoc,
  ApiErrorResponses,
  ApiGetPagedDoc,
} from '../../common/decorators';

@ApiTags('Chat')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('ws-ticket')
  @ApiOperation({
    summary: 'Emitir ticket efímero para el WebSocket del chat',
  })
  @ApiResponse({ status: 201, description: 'Ticket emitido correctamente.' })
  @ApiResponse({ status: 401, description: 'Sesión inválida.' })
  async emitirTicketWs(@GetUser() usuario: Record<string, any>) {
    if (!usuario?.sub) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const configurado = Number(
      this.configService.get<string>('WS_TICKET_TTL') ?? 60,
    );
    const expiresIn =
      Number.isFinite(configurado) && configurado > 0 ? configurado : 60;

    const token = await this.jwtService.signAsync(
      {
        sub: usuario.sub,
        rolPublicId: usuario.rolId,
        nombreUsuario: usuario.nombreUsuario,
        scope: 'ws',
      },
      { expiresIn },
    );

    return { token, expiresIn };
  }

  @Get('conversaciones')
  @ApiOperation({ summary: 'Obtener conversaciones del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de conversaciones con último mensaje y no leídos.',
  })
  obtenerConversaciones(@GetUser('internalId') usuarioId: number) {
    return this.chatService.obtenerConversaciones(usuarioId);
  }

  @Post('conversaciones')
  @ApiCreateDoc(ConversacionResponseDto, 'conversación')
  @ApiOperation({ summary: 'Crear una nueva conversación' })
  @ApiResponse({
    status: 201,
    description: 'Conversación creada correctamente.',
  })
  crearConversacion(
    @GetUser('internalId') usuarioId: number,
    @Body() dto: CrearConversacionDto,
  ) {
    return this.chatService.crearConversacion(usuarioId, dto);
  }

  @Get('conversaciones/mensajes')
  @ApiGetPagedDoc(MensajeResponseDto, 'mensajes')
  @ApiOperation({ summary: 'Obtener mensajes de una conversación (paginado)' })
  @ApiResponse({ status: 200, description: 'Mensajes paginados.' })
  obtenerMensajes(
    @GetUser('internalId') usuarioId: number,
    @Query() query: BuscarMensajesDto,
  ) {
    return this.chatService.obtenerMensajes(
      query.conversacionId,
      usuarioId,
      query,
    );
  }

  @Post('conversaciones/participantes')
  @ApiCreateDoc(ConversacionParticipanteResponseDto, 'participante')
  @ApiOperation({ summary: 'Agregar participante a una conversación grupal' })
  @ApiResponse({ status: 201, description: 'Participante agregado.' })
  agregarParticipante(
    @Query('conversacionId', PublicIdPipe) conversacionId: string,
    @Body() dto: AgregarParticipanteDto,
  ) {
    return this.chatService.agregarParticipante(conversacionId, dto.usuarioId);
  }

  @Delete('conversaciones/participantes')
  @ApiDeleteDoc('participante')
  @ApiOperation({ summary: 'Eliminar participante de una conversación grupal' })
  @ApiResponse({ status: 200, description: 'Participante eliminado.' })
  eliminarParticipante(
    @Query('conversacionId', PublicIdPipe) conversacionId: string,
    @Query('usuarioId', PublicIdPipe) usuarioId: string,
  ) {
    return this.chatService.eliminarParticipante(conversacionId, usuarioId);
  }
}
