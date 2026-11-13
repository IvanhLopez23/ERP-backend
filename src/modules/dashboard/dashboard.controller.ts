import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { DashboardVentasService } from './ventas.service';
import { DashboardComprasService } from './compras.service';
import { DashboardAlmacenService } from './almacen.service';
import { DashboardRhService } from './rh.service';
import { DashboardMantenimientoService } from './mantenimiento.service';
import { DashboardFinanzasService } from './finanzas.service';
import {
  DashboardResponseDto,
  GraficaDto,
  KpiDto,
  RangoDashboardDto,
  SerieDto,
} from './dto';
import {
  ApiBearerAuthDoc,
  ApiErrorResponses,
  ApiGetDoc,
} from '../../common/decorators';

@ApiTags('Dashboard')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@ApiExtraModels(DashboardResponseDto, GraficaDto, KpiDto, SerieDto)
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardVentasService: DashboardVentasService,
    private readonly dashboardComprasService: DashboardComprasService,
    private readonly dashboardAlmacenService: DashboardAlmacenService,
    private readonly dashboardRhService: DashboardRhService,
    private readonly dashboardMantenimientoService: DashboardMantenimientoService,
    private readonly dashboardFinanzasService: DashboardFinanzasService,
  ) {}

  @Get('ventas')
  @RequirePermission('/ventas')
  @ApiGetDoc(DashboardResponseDto, 'dashboard de ventas')
  obtenerVentas(@Query() query: RangoDashboardDto) {
    return this.dashboardVentasService.obtenerDashboardVentas(query);
  }

  @Get('compras')
  @RequirePermission('/compras')
  @ApiGetDoc(DashboardResponseDto, 'dashboard de compras')
  obtenerCompras(@Query() query: RangoDashboardDto) {
    return this.dashboardComprasService.obtenerDashboardCompras(query);
  }

  @Get('almacen')
  @RequirePermission('/almacen')
  @ApiGetDoc(DashboardResponseDto, 'dashboard de almacén')
  obtenerAlmacen(@Query() query: RangoDashboardDto) {
    return this.dashboardAlmacenService.obtenerDashboardAlmacen(query);
  }

  @Get('rh')
  @RequirePermission('/rh')
  @ApiGetDoc(DashboardResponseDto, 'dashboard de RH')
  obtenerRh(@Query() query: RangoDashboardDto) {
    return this.dashboardRhService.obtenerDashboardRh(query);
  }

  @Get('mantenimiento')
  @RequirePermission('/mantenimiento')
  @ApiGetDoc(DashboardResponseDto, 'dashboard de mantenimiento')
  obtenerMantenimiento(@Query() query: RangoDashboardDto) {
    return this.dashboardMantenimientoService.obtenerDashboardMantenimiento(
      query,
    );
  }

  @Get('finanzas')
  @RequirePermission('/contabilidad')
  @ApiGetDoc(DashboardResponseDto, 'dashboard financiero')
  obtenerFinanzas(@Query() query: RangoDashboardDto) {
    return this.dashboardFinanzasService.obtenerDashboardFinanzas(query);
  }
}
