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
import { PuestosService } from './puestos.service';
import { CreatePuestoDto } from './dto/create-puesto.dto';
import { UpdatePuestoDto } from './dto/update-puesto.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { PuestoResponseDto } from './dto/puesto.response.dto';
import { DepartamentoResponseDto } from './dto/departamento.response.dto';
import { FiltrarPuestosDto } from './dto/filtrar-puestos.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('RH - Puestos')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/rh/puestos')
@Controller('rh/puestos')
export class PuestosController {
  constructor(private readonly puestosService: PuestosService) {}

  @Post()
  @ApiCreateDoc(PuestoResponseDto, 'puesto')
  crear(@Body() dto: CreatePuestoDto) {
    return this.puestosService.crearPuesto(dto);
  }

  @Get()
  @ApiGetDoc(PuestoResponseDto, 'puestos')
  buscar() {
    return this.puestosService.buscarPuestos();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(PuestoResponseDto, 'puestos')
  paginado(@Query() paginacionDto: FiltrarPuestosDto) {
    return this.puestosService.paginarPuestos(paginacionDto);
  }

  @Get('departamento')
  @ApiGetDoc(PuestoResponseDto, 'puestos')
  buscarPorDepartamento(
    @Query('departamentoId', PublicIdPipe) departamentoId: string,
  ) {
    return this.puestosService.buscarPuestosPorDepartamentoId(departamentoId);
  }

  @Get('departamentos')
  @ApiGetDoc(DepartamentoResponseDto, 'departamentos activos')
  buscarDepartamentosActivos() {
    return this.puestosService.buscarDepartamentosActivos();
  }

  @Get(':publicId')
  @ApiGetDetailDoc(PuestoResponseDto, 'puesto')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.puestosService.buscarPuestoPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('puesto')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdatePuestoDto,
  ) {
    return this.puestosService.actualizarPuesto(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('puesto')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.puestosService.activarDesactivarPuesto(publicId);
  }
}
