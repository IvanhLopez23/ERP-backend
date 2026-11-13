import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { DetallesOrdenService } from './detalles-orden.service';
import { CreateDetalleOrdenTrabajoDto } from './dto/create-detalle-orden.dto';
import { UpdateDetalleOrdenTrabajoDto } from './dto/update-detalle-orden.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { DetalleOrdenTrabajoResponseDto } from './dto/detalle-orden-trabajo.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Mantenimiento - Detalles de Orden')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/mantenimiento/ordenes-trabajo')
@Controller('mantenimiento/detalles-orden')
export class DetallesOrdenController {
  constructor(private readonly detallesOrdenService: DetallesOrdenService) {}

  @Post()
  @ApiCreateDoc(DetalleOrdenTrabajoResponseDto, 'detalle de orden')
  crear(
    @Query('ordenPublicId', PublicIdPipe) ordenPublicId: string,
    @Body() dto: CreateDetalleOrdenTrabajoDto,
  ) {
    return this.detallesOrdenService.crearDetalle(ordenPublicId, dto);
  }

  @Get()
  @ApiGetDoc(DetalleOrdenTrabajoResponseDto, 'detalles de orden')
  buscar(@Query('ordenPublicId', PublicIdPipe) ordenPublicId: string) {
    return this.detallesOrdenService.buscarDetallesPorOrden(ordenPublicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('detalle de orden')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateDetalleOrdenTrabajoDto,
  ) {
    return this.detallesOrdenService.actualizarDetalle(publicId, dto);
  }
}
