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
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateEstatusVentaDto } from './dto/update-estatus-venta.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { VentaResponseDto } from './dto/venta.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Ventas - Ventas')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/ventas/ventas')
@Controller('ventas/ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Post()
  @ApiCreateDoc(VentaResponseDto, 'venta')
  crear(@Body() dto: CreateVentaDto, @GetUser('internalId') usuarioId: number) {
    return this.ventasService.crearVenta(dto, usuarioId);
  }

  @Get()
  @ApiGetDoc(VentaResponseDto, 'ventas')
  buscar() {
    return this.ventasService.buscarVentas();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(VentaResponseDto, 'ventas')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.ventasService.paginarVentas(paginacionDto);
  }

  @Get('cliente')
  @ApiGetDoc(VentaResponseDto, 'ventas')
  buscarPorCliente(@Query('clienteId', PublicIdPipe) clienteId: string) {
    return this.ventasService.buscarVentasPorCliente(clienteId);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(VentaResponseDto, 'venta')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.ventasService.buscarVentaPorId(publicId);
  }

  @Patch('estatus/:publicId')
  @ApiUpdateDoc('venta')
  actualizarEstatus(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateEstatusVentaDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.ventasService.actualizarEstatusVenta(publicId, dto, usuarioId);
  }
}
