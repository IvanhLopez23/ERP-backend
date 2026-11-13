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
import { CotizacionesService } from './cotizaciones.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateEstatusCotizacionDto } from './dto/update-estatus-cotizacion.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { CotizacionResponseDto } from './dto/cotizacion.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Ventas - Cotizaciones')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/ventas/cotizaciones')
@Controller('ventas/cotizaciones')
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  @Post()
  @ApiCreateDoc(CotizacionResponseDto, 'cotización')
  crear(
    @Body() dto: CreateCotizacionDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.cotizacionesService.crearCotizacion(dto, usuarioId);
  }

  @Get()
  @ApiGetDoc(CotizacionResponseDto, 'cotizaciones')
  buscar() {
    return this.cotizacionesService.buscarCotizaciones();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(CotizacionResponseDto, 'cotizaciones')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.cotizacionesService.paginarCotizaciones(paginacionDto);
  }

  @Get('cliente')
  @ApiGetDoc(CotizacionResponseDto, 'cotizaciones')
  buscarPorCliente(@Query('clienteId', PublicIdPipe) clienteId: string) {
    return this.cotizacionesService.buscarCotizacionesPorCliente(clienteId);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(CotizacionResponseDto, 'cotización')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.cotizacionesService.buscarCotizacionPorId(publicId);
  }

  @Patch('estatus/:publicId')
  @ApiUpdateDoc('cotización')
  actualizarEstatus(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateEstatusCotizacionDto,
  ) {
    return this.cotizacionesService.actualizarEstatusCotizacion(publicId, dto);
  }
}
