import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PublicIdPipe } from '../../common/validation/public-id';
import { ComedorService } from './comedor.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { CreateMenuComedorDto } from './dto/create-menu-comedor.dto';
import { CreateSolicitudComedorDto } from './dto/create-solicitud-comedor.dto';
import { TurnoResponseDto } from '../rh/dto/turno.response.dto';
import { MenuComedorResponseDto } from './dto/menu-comedor.response.dto';
import { SolicitudComedorResponseDto } from './dto/solicitud-comedor.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiDeleteDoc,
  ApiErrorResponses,
  ApiGetDoc,
} from '../../common/decorators';

@ApiTags('RH - Comedor')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard)
@Controller('comedor')
export class ComedorController {
  constructor(private readonly comedorService: ComedorService) {}

  @Get('turnos')
  @ApiGetDoc(TurnoResponseDto, 'turnos de comedor')
  @ApiOperation({
    summary: 'Listar turnos activos y su periodicidad de comedor',
  })
  listarTurnos() {
    return this.comedorService.listarTurnos();
  }

  @Post('turnos')
  @ApiCreateDoc(TurnoResponseDto, 'turno de comedor')
  @ApiOperation({ summary: 'Crear un turno de comedor' })
  crearTurno(
    @Body() dto: CreateTurnoDto,
    @GetUser('internalRoleId') internalRoleId: number,
  ) {
    return this.comedorService.crearTurno(dto, internalRoleId);
  }

  @Get('menus')
  @ApiGetDoc(MenuComedorResponseDto, 'menús de comedor')
  @ApiOperation({ summary: 'Listar menús activos del comedor' })
  listarMenus() {
    return this.comedorService.listarMenus();
  }

  @Get('menus/siguiente')
  @ApiGetDoc(MenuComedorResponseDto, 'menús de comedor')
  @ApiOperation({
    summary: 'Consultar el menú del siguiente periodo del empleado',
  })
  listarSiguienteMenu(@GetUser('internalId') internalUserId: number) {
    return this.comedorService.listarSiguienteMenu(internalUserId);
  }

  @Post('menus')
  @ApiCreateDoc(MenuComedorResponseDto, 'menú de comedor')
  @ApiOperation({ summary: 'Crear un menú para un periodo' })
  crearMenu(
    @Body() dto: CreateMenuComedorDto,
    @GetUser('internalRoleId') internalRoleId: number,
  ) {
    return this.comedorService.crearMenu(dto, internalRoleId);
  }

  @Post('solicitudes')
  @ApiCreateDoc(SolicitudComedorResponseDto, 'solicitud de comedor')
  @ApiOperation({ summary: 'Separar comidas del siguiente menú permitido' })
  crearSolicitud(
    @Body() dto: CreateSolicitudComedorDto,
    @GetUser('internalId') internalUserId: number,
  ) {
    return this.comedorService.crearSolicitud(dto, internalUserId);
  }

  @Get('solicitudes/mias')
  @ApiGetDoc(SolicitudComedorResponseDto, 'solicitudes de comedor')
  @ApiOperation({ summary: 'Listar mis solicitudes de comedor' })
  listarMisSolicitudes(@GetUser('internalId') internalUserId: number) {
    return this.comedorService.listarMisSolicitudes(internalUserId);
  }

  @Delete('solicitudes/:publicId')
  @ApiDeleteDoc('solicitud de comedor')
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Cancelar una solicitud propia de comedor' })
  cancelarSolicitud(
    @Param('publicId', PublicIdPipe) publicId: string,
    @GetUser('internalId') internalUserId: number,
  ) {
    return this.comedorService.cancelarSolicitud(publicId, internalUserId);
  }
}
