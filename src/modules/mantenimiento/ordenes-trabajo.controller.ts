import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { OrdenesTrabajoService } from './ordenes-trabajo.service';
import { CreateOrdenTrabajoDto } from './dto/create-orden-trabajo.dto';
import { UpdateEstatusOrdenDto } from './dto/update-estatus-orden.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { OrdenTrabajoResponseDto } from './dto/orden-trabajo.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Mantenimiento - Órdenes de Trabajo')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/mantenimiento/ordenes-trabajo')
@Controller('mantenimiento/ordenes-trabajo')
export class OrdenesTrabajoController {
  constructor(private readonly ordenesTrabajoService: OrdenesTrabajoService) {}

  @Post()
  @ApiCreateDoc(OrdenTrabajoResponseDto, 'orden de trabajo')
  crear(
    @Body() dto: CreateOrdenTrabajoDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.ordenesTrabajoService.crearOrden(dto, usuarioId);
  }

  @Get()
  @ApiGetDoc(OrdenTrabajoResponseDto, 'órdenes de trabajo')
  buscar() {
    return this.ordenesTrabajoService.buscarOrdenes();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(OrdenTrabajoResponseDto, 'órdenes de trabajo')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.ordenesTrabajoService.paginarOrdenes(paginacionDto);
  }

  @Get('equipo')
  @ApiGetDoc(OrdenTrabajoResponseDto, 'órdenes de trabajo')
  buscarPorEquipo(@Query('equipoId', PublicIdPipe) equipoId: string) {
    return this.ordenesTrabajoService.buscarOrdenesPorEquipo(equipoId);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(OrdenTrabajoResponseDto, 'orden de trabajo')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.ordenesTrabajoService.buscarOrdenPorId(publicId);
  }

  @Patch('estatus/:publicId')
  @ApiUpdateDoc('orden de trabajo')
  actualizarEstatus(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateEstatusOrdenDto,
  ) {
    return this.ordenesTrabajoService.actualizarEstatusOrden(publicId, dto);
  }
}
