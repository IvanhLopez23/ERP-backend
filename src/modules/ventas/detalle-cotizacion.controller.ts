import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PublicIdPipe } from '../../common/validation/public-id';
import { CotizacionesService } from './cotizaciones.service';
import { DetalleCotizacionResponseDto } from './dto/detalle-cotizacion.response.dto';

import {
  ApiBearerAuthDoc,
  ApiErrorResponses,
  ApiGetDoc,
} from '../../common/decorators';

@ApiTags('Ventas - Detalles de Cotización')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/ventas/cotizaciones')
@Controller('ventas/detalles-cotizacion')
export class DetalleCotizacionController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  @Get()
  @ApiGetDoc(DetalleCotizacionResponseDto, 'detalles de cotización')
  buscar(@Query('cotizacionId', PublicIdPipe) cotizacionId: string) {
    return this.cotizacionesService.buscarDetallesCotizacion(cotizacionId);
  }
}
