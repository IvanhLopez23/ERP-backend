import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { BitacoraAccionResponseDto } from './dto/auditoria.response.dto';

import {
  ApiBearerAuthDoc,
  ApiErrorResponses,
  ApiGetDoc,
  ApiGetPagedDoc,
} from '../../common/decorators';

@ApiTags('Auditoria')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/configuraciones/auditoria')
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get('acciones/paginacion')
  @ApiGetPagedDoc(BitacoraAccionResponseDto, 'auditoria')
  buscarAcciones(@Query() paginacionDto: PaginacionDto) {
    return this.auditoriaService.paginadoAcciones(paginacionDto);
  }
}
