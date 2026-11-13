import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { BitacoraAccesosService } from './bitacora-accesos.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { BitacoraAccesoResponseDto } from './dto/bitacora-acceso.response.dto';

import {
  ApiBearerAuthDoc,
  ApiErrorResponses,
  ApiGetDoc,
  ApiGetPagedDoc,
} from '../../common/decorators';

@ApiTags('Bitacora Accesos')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/configuraciones/bitacora-accesos')
@Controller('bitacora-accesos')
export class BitacoraAccesosController {
  constructor(
    private readonly bitacoraAccesosService: BitacoraAccesosService,
  ) {}

  @Get()
  @ApiGetDoc(BitacoraAccesoResponseDto, 'bitácoras de acceso')
  buscar() {
    return this.bitacoraAccesosService.buscar();
  }

  @Get('usuario/:publicId')
  @ApiGetDoc(BitacoraAccesoResponseDto, 'bitácoras de acceso')
  buscarPorUsuario(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.bitacoraAccesosService.buscarPorUsuario(publicId);
  }

  @Get('paginacion')
  @ApiGetPagedDoc(BitacoraAccesoResponseDto, 'bitácoras de acceso')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.bitacoraAccesosService.paginado(paginacionDto);
  }
}
