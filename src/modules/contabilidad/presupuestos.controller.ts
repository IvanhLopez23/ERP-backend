import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { PresupuestosService } from './presupuestos.service';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import {
  CrearPresupuestosBulkDto,
  PresupuestosQueryDto,
  UpdatePresupuestoDto,
} from './dto/update-presupuesto.dto';
import { PresupuestoResponseDto } from './dto/presupuesto.response.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { ApiBearerAuthDoc, ApiErrorResponses } from '../../common/decorators';

@ApiTags('Contabilidad - Presupuestos')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/contabilidad/presupuestos')
@Controller('contabilidad/presupuestos')
export class PresupuestosController {
  constructor(private readonly presupuestosService: PresupuestosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar presupuestos por centro de costo' })
  @ApiOkResponse({ type: [PresupuestoResponseDto] })
  buscar(@Query() query: PresupuestosQueryDto) {
    return this.presupuestosService.buscar(query);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Detalle de un presupuesto' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: PresupuestoResponseDto })
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.presupuestosService.buscarPorId(publicId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un presupuesto mensual por centro' })
  @ApiCreatedResponse({ type: PresupuestoResponseDto })
  crear(
    @Body() dto: CreatePresupuestoDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.presupuestosService.crear(dto, usuarioId);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Crear o actualizar presupuestos en lote' })
  @ApiCreatedResponse({ description: 'Presupuestos guardados.' })
  crearBulk(
    @Body() dto: CrearPresupuestosBulkDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.presupuestosService.crearBulk(dto, usuarioId);
  }

  @Put(':publicId')
  @ApiOperation({ summary: 'Actualizar un presupuesto' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: PresupuestoResponseDto })
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdatePresupuestoDto,
  ) {
    return this.presupuestosService.actualizar(publicId, dto);
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Eliminar un presupuesto' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Presupuesto eliminado.' })
  eliminar(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.presupuestosService.eliminar(publicId);
  }
}
