import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { MovimientosRefaccionService } from './movimientos-refaccion.service';
import { CreateMovimientoRefaccionDto } from './dto/create-movimiento-refaccion.dto';
import { BuscarMovimientosRefaccionDto } from './dto/buscar-movimientos-refaccion.dto';
import { MovimientoRefaccionResponseDto } from './dto/movimiento-refaccion.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetPagedDoc,
} from '../../common/decorators';

@ApiTags('Mantenimiento - Movimientos de Refacciones')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/mantenimiento/refacciones')
@Controller('mantenimiento/movimientos-refaccion')
export class MovimientosRefaccionController {
  constructor(
    private readonly movimientosRefaccionService: MovimientosRefaccionService,
  ) {}

  @Post()
  @ApiCreateDoc(MovimientoRefaccionResponseDto, 'movimiento de refacción')
  crear(
    @Body() dto: CreateMovimientoRefaccionDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.movimientosRefaccionService.crearMovimientoRefaccion(
      dto,
      usuarioId,
    );
  }

  @Get()
  @ApiGetPagedDoc(MovimientoRefaccionResponseDto, 'movimientos de refacción')
  buscar(@Query() query: BuscarMovimientosRefaccionDto) {
    return this.movimientosRefaccionService.buscarMovimientosRefaccion(
      query,
      query.refaccionId,
      query.tipo,
    );
  }
}
