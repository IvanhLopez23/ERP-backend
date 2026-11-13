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
import { ComprasService } from './compras.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateEstatusCompraDto } from './dto/update-estatus-compra.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { PaginarComprasDto } from './dto/paginar-compras.dto';
import { CompraResponseDto } from './dto/compra.response.dto';
import { AlmacenResponseDto } from '../almacen/dto/almacen.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Compras - Órdenes de Compra')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/compras/compras')
@Controller('compras/compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Post()
  @ApiCreateDoc(CompraResponseDto, 'compra')
  crear(
    @Body() dto: CreateCompraDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.comprasService.crearCompra(dto, usuarioId);
  }

  @Get()
  @ApiGetDoc(CompraResponseDto, 'compras')
  buscar() {
    return this.comprasService.buscarCompras();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(CompraResponseDto, 'compras')
  paginado(@Query() query: PaginarComprasDto) {
    const { proveedorId, ...paginacionDto } = query;
    return this.comprasService.paginarCompras(paginacionDto, proveedorId);
  }

  @Get('almacenes')
  @ApiGetDoc(AlmacenResponseDto, 'almacenes')
  listarAlmacenes() {
    return this.comprasService.listarAlmacenesActivos();
  }

  @Get(':publicId')
  @ApiGetDetailDoc(CompraResponseDto, 'compra')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.comprasService.buscarCompraPorId(publicId);
  }

  @Patch('estatus/:publicId')
  @ApiUpdateDoc('compra')
  actualizarEstatus(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateEstatusCompraDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.comprasService.actualizarEstatusCompra(
      publicId,
      dto,
      usuarioId,
    );
  }
}
