import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { InventarioService } from './inventario.service';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { ConsultaStockInventarioDto } from './dto/consulta-stock-inventario.dto';
import { PublicIdPipe } from 'src/common/validation/public-id';
import { InventarioResponseDto } from './dto/inventario.response.dto';
import { AlmacenResponseDto } from './dto/almacen.response.dto';

import {
  ApiBearerAuthDoc,
  ApiErrorResponses,
  ApiGetDoc,
  ApiGetPagedDoc,
} from '../../common/decorators';

@ApiTags('Almacén - Inventario')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/almacen/inventario')
@Controller('almacen/inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get()
  @ApiGetDoc(InventarioResponseDto, 'inventario')
  buscar() {
    return this.inventarioService.buscarInventario();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(InventarioResponseDto, 'inventario')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.inventarioService.paginarInventario(paginacionDto);
  }

  @Get('almacenes')
  @ApiGetDoc(AlmacenResponseDto, 'almacenes')
  listarAlmacenes() {
    return this.inventarioService.listarAlmacenesActivos();
  }

  @Get('stock')
  @ApiGetPagedDoc(InventarioResponseDto, 'stock por almacén')
  stock(@Query() query: ConsultaStockInventarioDto) {
    return this.inventarioService.buscarStock(query);
  }

  @Get('producto')
  buscarPorProductoAlmacen(
    @Query('productoId', PublicIdPipe) productoId: string,
    @Query('almacenId', PublicIdPipe) almacenId: string,
  ) {
    return this.inventarioService.buscarInventarioPorProductoAlmacen(
      productoId,
      almacenId,
    );
  }
}
