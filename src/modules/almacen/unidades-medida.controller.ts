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
import { UnidadesMedidaService } from './unidades-medida.service';
import { CreateUnidadMedidaDto } from './dto/create-unidad-medida.dto';
import { UpdateUnidadMedidaDto } from './dto/update-unidad-medida.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { UnidadMedidaResponseDto } from './dto/unidad-medida.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Almacén - Unidades de Medida')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/almacen/unidades-medida')
@Controller('almacen/unidades-medida')
export class UnidadesMedidaController {
  constructor(private readonly unidadesMedidaService: UnidadesMedidaService) {}

  @Post()
  @ApiCreateDoc(UnidadMedidaResponseDto, 'unidad de medida')
  crear(@Body() dto: CreateUnidadMedidaDto) {
    return this.unidadesMedidaService.crearUnidadMedida(dto);
  }

  @Get()
  @ApiGetDoc(UnidadMedidaResponseDto, 'unidades de medida')
  buscar() {
    return this.unidadesMedidaService.buscarUnidadesMedida();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(UnidadMedidaResponseDto, 'unidades de medida')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.unidadesMedidaService.paginarUnidadesMedida(paginacionDto);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(UnidadMedidaResponseDto, 'unidad de medida')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.unidadesMedidaService.buscarUnidadMedidaPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('unidad de medida')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateUnidadMedidaDto,
  ) {
    return this.unidadesMedidaService.actualizarUnidadMedida(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('unidad de medida')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.unidadesMedidaService.activarDesactivarUnidadMedida(publicId);
  }
}
