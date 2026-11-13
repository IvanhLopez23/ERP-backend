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
import { DepartamentosService } from './departamentos.service';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { DepartamentoResponseDto } from './dto/departamento.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('RH - Departamentos')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/rh/departamentos')
@Controller('rh/departamentos')
export class DepartamentosController {
  constructor(private readonly departamentosService: DepartamentosService) {}

  @Post()
  @ApiCreateDoc(DepartamentoResponseDto, 'departamento')
  crear(@Body() dto: CreateDepartamentoDto) {
    return this.departamentosService.crearDepartamento(dto);
  }

  @Get()
  @ApiGetDoc(DepartamentoResponseDto, 'departamentos')
  buscar() {
    return this.departamentosService.buscarDepartamentos();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(DepartamentoResponseDto, 'departamentos')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.departamentosService.paginarDepartamentos(paginacionDto);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(DepartamentoResponseDto, 'departamento')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.departamentosService.buscarDepartamentoPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('departamento')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateDepartamentoDto,
  ) {
    return this.departamentosService.actualizarDepartamento(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('departamento')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.departamentosService.activarDesactivarDepartamento(publicId);
  }
}
