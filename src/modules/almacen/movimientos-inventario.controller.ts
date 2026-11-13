import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { MovimientosInventarioService } from './movimientos-inventario.service';
import { CreateMovimientoInventarioDto } from './dto/create-movimiento-inventario.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { MovimientoInventarioResponseDto } from './dto/movimiento-inventario.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetPagedDoc,
} from '../../common/decorators';

@ApiTags('Almacén - Movimientos de Inventario')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/almacen/movimientos-inventario')
@Controller('almacen/movimientos-inventario')
export class MovimientosInventarioController {
  constructor(
    private readonly movimientosInventarioService: MovimientosInventarioService,
  ) {}

  @Post()
  @ApiCreateDoc(MovimientoInventarioResponseDto, 'movimiento de inventario')
  crear(
    @Body() dto: CreateMovimientoInventarioDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.movimientosInventarioService.crearMovimiento(dto, usuarioId);
  }

  @Get()
  @ApiGetPagedDoc(MovimientoInventarioResponseDto, 'movimientos de inventario')
  buscar(@Query() paginacionDto: PaginacionDto) {
    return this.movimientosInventarioService.buscarMovimientos(paginacionDto);
  }
}
