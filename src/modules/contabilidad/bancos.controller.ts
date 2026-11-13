import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { BancosService } from './bancos.service';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';
import { CreateMovimientoBancarioDto } from './dto/create-movimiento-bancario.dto';
import { ConciliarMovimientoDto } from './dto/conciliar-movimiento.dto';
import { ConciliarMovimientoMultipleDto } from './dto/conciliar-movimiento-multiple.dto';
import { ConciliarAutomaticoDto } from './dto/conciliar-automatico.dto';
import { ImportarMovimientosQueryDto } from './dto/importar-movimientos.query.dto';
import {
  ConciliacionQueryDto,
  MovimientosBancariosQueryDto,
} from './dto/movimientos-bancarios.query.dto';
import {
  ConciliacionResponseDto,
  CuentaBancariaResponseDto,
  MovimientoBancarioResponseDto,
} from './dto/bancos.response.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { ApiBearerAuthDoc, ApiErrorResponses } from '../../common/decorators';

@ApiTags('Contabilidad - Bancos')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/contabilidad/bancos')
@Controller('contabilidad/bancos')
export class BancosController {
  constructor(private readonly bancosService: BancosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cuentas bancarias' })
  @ApiOkResponse({ type: [CuentaBancariaResponseDto] })
  buscar() {
    return this.bancosService.buscar();
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Detalle de una cuenta bancaria' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: CuentaBancariaResponseDto })
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.bancosService.buscarPorId(publicId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una cuenta bancaria' })
  @ApiCreatedResponse({ type: CuentaBancariaResponseDto })
  crear(
    @Body() dto: CreateCuentaBancariaDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.bancosService.crear(dto, usuarioId);
  }

  @Put(':publicId')
  @ApiOperation({ summary: 'Actualizar una cuenta bancaria' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Cuenta bancaria actualizada.' })
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateCuentaBancariaDto,
  ) {
    return this.bancosService.actualizar(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiOperation({ summary: 'Activar o desactivar una cuenta bancaria' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Estatus actualizado.' })
  activarDesactivar(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.bancosService.activarDesactivar(publicId);
  }

  @Post(':publicId/movimientos')
  @ApiOperation({ summary: 'Registrar un movimiento bancario' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiCreatedResponse({ type: MovimientoBancarioResponseDto })
  crearMovimiento(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: CreateMovimientoBancarioDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.bancosService.crearMovimiento(publicId, dto, usuarioId);
  }

  @Post(':publicId/movimientos/importar')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Importar movimientos desde CSV u OFX' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: { type: 'string', format: 'binary' },
        formato: { type: 'string', enum: ['auto', 'csv', 'ofx'] },
      },
      required: ['archivo'],
    },
  })
  @ApiCreatedResponse({ description: 'Resultado de la importación.' })
  importarMovimientos(
    @Param('publicId', PublicIdPipe) publicId: string,
    @UploadedFile() archivo: Express.Multer.File,
    @Query() query: ImportarMovimientosQueryDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    if (!archivo?.buffer) {
      throw new BadRequestException(
        'Debes adjuntar un archivo CSV u OFX en el campo "archivo"',
      );
    }
    return this.bancosService.importarMovimientos(
      publicId,
      archivo.buffer,
      archivo.originalname,
      query.formato ?? 'auto',
      usuarioId,
    );
  }

  @Get(':publicId/movimientos')
  @ApiOperation({ summary: 'Listar movimientos bancarios' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: [MovimientoBancarioResponseDto] })
  listarMovimientos(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Query() query: MovimientosBancariosQueryDto,
  ) {
    return this.bancosService.listarMovimientos(publicId, query);
  }

  @Get(':publicId/conciliacion')
  @ApiOperation({
    summary: 'Estado de conciliación bancaria y partidas pendientes',
  })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: ConciliacionResponseDto })
  conciliacion(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Query() query: ConciliacionQueryDto,
  ) {
    return this.bancosService.conciliacion(publicId, query);
  }

  @Post(':publicId/conciliar-automatico')
  @ApiOperation({ summary: 'Conciliar automáticamente por monto y fecha' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiCreatedResponse({
    description: 'Resultado de la conciliación automática.',
  })
  conciliarAutomatico(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: ConciliarAutomaticoDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.bancosService.conciliarAutomatico(publicId, dto, usuarioId);
  }

  @Patch(':publicId/movimientos/:movimientoId/conciliar-multiple')
  @ApiOperation({
    summary: 'Conciliar un movimiento contra varios detalles de póliza',
  })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiParam({ name: 'movimientoId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: MovimientoBancarioResponseDto })
  conciliarMultiple(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Param('movimientoId', PublicIdPipe) movimientoId: string,
    @Body() dto: ConciliarMovimientoMultipleDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.bancosService.conciliarMultiple(
      publicId,
      movimientoId,
      dto,
      usuarioId,
    );
  }

  @Patch(':publicId/movimientos/:movimientoId/conciliar')
  @ApiOperation({ summary: 'Conciliar un movimiento manualmente' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiParam({ name: 'movimientoId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: MovimientoBancarioResponseDto })
  conciliar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Param('movimientoId', PublicIdPipe) movimientoId: string,
    @Body() dto: ConciliarMovimientoDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.bancosService.conciliar(publicId, movimientoId, dto, usuarioId);
  }

  @Patch(':publicId/movimientos/:movimientoId/desconciliar')
  @ApiOperation({ summary: 'Desconciliar un movimiento bancario' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiParam({ name: 'movimientoId', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Movimiento desconciliado.' })
  desconciliar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Param('movimientoId', PublicIdPipe) movimientoId: string,
  ) {
    return this.bancosService.desconciliar(publicId, movimientoId);
  }
}
