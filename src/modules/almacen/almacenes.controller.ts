import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Query,
  Put,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { AlmacenesService } from './almacenes.service';
import { CreateAlmacenDto } from './dto/create-almacen.dto';
import { UpdateAlmacenDto } from './dto/update-almacen.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { AlmacenResponseDto } from './dto/almacen.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Almacén - Almacenes')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/almacen/almacenes')
@Controller('almacen/almacenes')
export class AlmacenesController {
  constructor(private readonly almacenesService: AlmacenesService) {}

  @Post()
  @ApiCreateDoc(AlmacenResponseDto, 'almacén')
  crear(@Body() dto: CreateAlmacenDto) {
    return this.almacenesService.crearAlmacen(dto);
  }

  @Get()
  @ApiGetDoc(AlmacenResponseDto, 'almacenes')
  buscar() {
    return this.almacenesService.buscarAlmacenes();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(AlmacenResponseDto, 'almacenes')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.almacenesService.paginarAlmacenes(paginacionDto);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(AlmacenResponseDto, 'almacén')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.almacenesService.buscarAlmacenPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('almacén')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateAlmacenDto,
  ) {
    return this.almacenesService.actualizarAlmacen(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('almacén')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.almacenesService.activarDesactivarAlmacen(publicId);
  }
}
