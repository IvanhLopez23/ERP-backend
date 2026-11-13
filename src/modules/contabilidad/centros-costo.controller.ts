import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CentrosCostoService } from './centros-costo.service';
import { CreateCentroCostoDto } from './dto/create-centro-costo.dto';
import {
  CentrosCostoQueryDto,
  UpdateCentroCostoDto,
} from './dto/update-centro-costo.dto';
import { CentroCostoResponseDto } from './dto/centro-costo.response.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { ApiBearerAuthDoc, ApiErrorResponses } from '../../common/decorators';

@ApiTags('Contabilidad - Centros de costo')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/contabilidad/centros-costo')
@Controller('contabilidad/centros-costo')
export class CentrosCostoController {
  constructor(private readonly centrosCostoService: CentrosCostoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar centros de costo, áreas o proyectos' })
  @ApiOkResponse({ type: [CentroCostoResponseDto] })
  buscar(@Query() query: CentrosCostoQueryDto) {
    return this.centrosCostoService.buscar(query);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Detalle de un centro de costo' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: CentroCostoResponseDto })
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.centrosCostoService.buscarPorId(publicId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un centro de costo' })
  @ApiCreatedResponse({ type: CentroCostoResponseDto })
  crear(
    @Body() dto: CreateCentroCostoDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.centrosCostoService.crear(dto, usuarioId);
  }

  @Put(':publicId')
  @ApiOperation({ summary: 'Actualizar un centro de costo' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Centro de costo actualizado.' })
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateCentroCostoDto,
  ) {
    return this.centrosCostoService.actualizar(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiOperation({ summary: 'Activar o desactivar un centro de costo' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Estatus actualizado.' })
  activarDesactivar(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.centrosCostoService.activarDesactivar(publicId);
  }
}
