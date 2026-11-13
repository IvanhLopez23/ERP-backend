import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Query,
  Put,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PlanesMantenimientoService } from './planes-mantenimiento.service';
import { CreatePlanMantenimientoDto } from './dto/create-plan-mantenimiento.dto';
import { UpdatePlanMantenimientoDto } from './dto/update-plan-mantenimiento.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { PlanMantenimientoResponseDto } from './dto/plan-mantenimiento.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Mantenimiento - Planes de Mantenimiento')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/mantenimiento/planes-mantenimiento')
@Controller('mantenimiento/planes-mantenimiento')
export class PlanesMantenimientoController {
  constructor(
    private readonly planesMantenimientoService: PlanesMantenimientoService,
  ) {}

  @Post()
  @ApiCreateDoc(PlanMantenimientoResponseDto, 'plan de mantenimiento')
  crear(@Body() dto: CreatePlanMantenimientoDto) {
    return this.planesMantenimientoService.crearPlan(dto);
  }

  @Get()
  @ApiGetDoc(PlanMantenimientoResponseDto, 'planes de mantenimiento')
  buscar() {
    return this.planesMantenimientoService.buscarPlanes();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(PlanMantenimientoResponseDto, 'planes de mantenimiento')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.planesMantenimientoService.paginarPlanes(paginacionDto);
  }

  @Get('equipo')
  @ApiGetDoc(PlanMantenimientoResponseDto, 'planes de mantenimiento')
  buscarPorEquipo(@Query('equipoId', PublicIdPipe) equipoId: string) {
    return this.planesMantenimientoService.buscarPlanesPorEquipo(equipoId);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(PlanMantenimientoResponseDto, 'plan de mantenimiento')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.planesMantenimientoService.buscarPlanPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('plan de mantenimiento')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdatePlanMantenimientoDto,
  ) {
    return this.planesMantenimientoService.actualizarPlan(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('plan de mantenimiento')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.planesMantenimientoService.activarDesactivarPlan(publicId);
  }
}
