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
import { EquiposService } from './equipos.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { EquipoResponseDto } from './dto/equipo.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Mantenimiento - Equipos')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/mantenimiento/equipos')
@Controller('mantenimiento/equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  @Post()
  @ApiCreateDoc(EquipoResponseDto, 'equipo')
  crear(@Body() dto: CreateEquipoDto) {
    return this.equiposService.crearEquipo(dto);
  }

  @Get()
  @ApiGetDoc(EquipoResponseDto, 'equipos')
  buscar() {
    return this.equiposService.buscarEquipos();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(EquipoResponseDto, 'equipos')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.equiposService.paginarEquipos(paginacionDto);
  }

  @Get('estado')
  @ApiGetDoc(EquipoResponseDto, 'equipos')
  buscarPorEstado(@Query('estado') estado: string) {
    return this.equiposService.buscarEquiposPorEstado(estado);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(EquipoResponseDto, 'equipo')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.equiposService.buscarEquipoPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('equipo')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateEquipoDto,
  ) {
    return this.equiposService.actualizarEquipo(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('equipo')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.equiposService.activarDesactivarEquipo(publicId);
  }
}
