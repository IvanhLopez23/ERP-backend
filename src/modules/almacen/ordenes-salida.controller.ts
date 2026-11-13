import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { OrdenesSalidaService } from './ordenes-salida.service';
import { CreateOrdenSalidaDto } from './dto/create-orden-salida.dto';
import { BuscarOrdenesSalidaDto } from './dto/buscar-ordenes-salida.dto';
import { OrdenSalidaResponseDto } from './dto/orden-salida.response.dto';
import { AlmacenResponseDto } from './dto/almacen.response.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
} from '../../common/decorators';

@ApiTags('Almacén - Órdenes de salida')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/almacen/movimientos-inventario')
@Controller('almacen/salidas')
export class OrdenesSalidaController {
  constructor(
    private readonly ordenesSalidaService: OrdenesSalidaService,
  ) {}

  @Post()
  @ApiCreateDoc(OrdenSalidaResponseDto, 'orden de salida')
  crear(
    @Body() dto: CreateOrdenSalidaDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.ordenesSalidaService.crearOrdenSalida(dto, usuarioId);
  }

  @Get()
  @ApiGetPagedDoc(OrdenSalidaResponseDto, 'órdenes de salida')
  buscar(@Query() query: BuscarOrdenesSalidaDto) {
    return this.ordenesSalidaService.buscarOrdenes(query);
  }

  @Get('almacenes')
  @ApiGetDoc(AlmacenResponseDto, 'almacenes')
  listarAlmacenes() {
    return this.ordenesSalidaService.listarAlmacenesActivos();
  }

  @Get('stock')
  @ApiGetDoc(OrdenSalidaResponseDto, 'stock del almacén')
  listarStock(@Query('almacenId', PublicIdPipe) almacenId: string) {
    return this.ordenesSalidaService.listarStockAlmacen(almacenId);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(OrdenSalidaResponseDto, 'orden de salida')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.ordenesSalidaService.buscarOrdenPorId(publicId);
  }
}
