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
import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { ContratoResponseDto } from './dto/contrato.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('RH - Contratos')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/rh/contratos')
@Controller('rh/contratos')
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  @Post()
  @ApiCreateDoc(ContratoResponseDto, 'contrato')
  crear(@Body() dto: CreateContratoDto) {
    return this.contratosService.crearContrato(dto);
  }

  @Get()
  @ApiGetDoc(ContratoResponseDto, 'contratos')
  buscar() {
    return this.contratosService.buscarContratos();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(ContratoResponseDto, 'contratos')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.contratosService.paginarContratos(paginacionDto);
  }

  @Get('empleado')
  @ApiGetDoc(ContratoResponseDto, 'contratos')
  buscarPorEmpleado(@Query('empleadoId', PublicIdPipe) empleadoId: string) {
    return this.contratosService.buscarContratosPorEmpleado(empleadoId);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(ContratoResponseDto, 'contrato')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.contratosService.buscarContratoPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('contrato')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateContratoDto,
  ) {
    return this.contratosService.actualizarContrato(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('contrato')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.contratosService.activarDesactivarContrato(publicId);
  }
}
