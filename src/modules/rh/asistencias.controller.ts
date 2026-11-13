import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { AsistenciasService } from './asistencias.service';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { BuscarAsistenciasDto } from './dto/buscar-asistencias.dto';
import { AsistenciaResponseDto } from './dto/asistencia.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetPagedDoc,
} from '../../common/decorators';

@ApiTags('RH - Asistencias')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/rh/asistencias')
@Controller('rh/asistencias')
export class AsistenciasController {
  constructor(private readonly asistenciasService: AsistenciasService) {}

  @Post()
  @ApiCreateDoc(AsistenciaResponseDto, 'asistencia')
  crear(@Body() dto: CreateAsistenciaDto) {
    return this.asistenciasService.crearAsistencia(dto);
  }

  @Get()
  @ApiGetPagedDoc(AsistenciaResponseDto, 'asistencias')
  buscar(@Query() query: BuscarAsistenciasDto) {
    return this.asistenciasService.buscarAsistencias(query);
  }
}
