import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PantallasService } from './pantallas.service';
import { CreatePantallaDto } from './dto/create-pantalla.dto';
import { UpdatePantallaDto } from './dto/update-pantalla.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PublicIdPipe } from '../../common/validation/public-id';
import { PantallaResponseDto } from './dto/pantalla.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Pantallas')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/configuraciones/pantallas')
@Controller('pantallas')
export class PantallasController {
  constructor(private readonly pantallasService: PantallasService) {}

  @Post()
  @ApiCreateDoc(PantallaResponseDto, 'pantalla')
  crear(@Body() createPantallaDto: CreatePantallaDto) {
    return this.pantallasService.crear(createPantallaDto);
  }

  @Get()
  @ApiGetDoc(PantallaResponseDto, 'pantallas')
  buscar() {
    return this.pantallasService.buscar();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(PantallaResponseDto, 'pantallas')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.pantallasService.paginado(paginacionDto);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(PantallaResponseDto, 'pantalla')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.pantallasService.buscarPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('pantalla')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() updatePantallaDto: UpdatePantallaDto,
  ) {
    return this.pantallasService.actualizar(publicId, updatePantallaDto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('pantalla')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.pantallasService.actualizarActivo(publicId);
  }

  @Get('menu/rol')
  @ApiGetDoc(PantallaResponseDto, 'pantallas')
  buscarMenuPorRolId(@Query('rolId', PublicIdPipe) rolId: string) {
    return this.pantallasService.buscarPorRolId(rolId);
  }

  @Get('menu/padres')
  @ApiGetDoc(PantallaResponseDto, 'pantallas')
  buscarMenuPorPadres() {
    return this.pantallasService.buscarPorPadres();
  }
}
