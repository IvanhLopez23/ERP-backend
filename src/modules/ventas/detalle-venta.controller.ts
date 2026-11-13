import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PublicIdPipe } from '../../common/validation/public-id';
import { VentasService } from './ventas.service';
import { DetalleVentaResponseDto } from './dto/detalle-venta.response.dto';

import {
  ApiBearerAuthDoc,
  ApiErrorResponses,
  ApiGetDoc,
} from '../../common/decorators';

@ApiTags('Ventas - Detalles de Venta')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/ventas/ventas')
@Controller('ventas/detalles-venta')
export class DetalleVentaController {
  constructor(private readonly ventasService: VentasService) {}

  @Get()
  @ApiGetDoc(DetalleVentaResponseDto, 'detalles de venta')
  buscar(@Query('ventaId', PublicIdPipe) ventaId: string) {
    return this.ventasService.buscarDetallesVenta(ventaId);
  }
}
