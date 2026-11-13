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
import { ReglasConciliacionService } from './reglas-conciliacion.service';
import { CreateReglaConciliacionDto } from './dto/create-regla-conciliacion.dto';
import {
  ReglasConciliacionQueryDto,
  UpdateReglaConciliacionDto,
} from './dto/update-regla-conciliacion.dto';
import { ReglaConciliacionResponseDto } from './dto/regla-conciliacion.response.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { ApiBearerAuthDoc, ApiErrorResponses } from '../../common/decorators';

@ApiTags('Contabilidad - Reglas de conciliación')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/contabilidad/bancos')
@Controller('contabilidad/reglas-conciliacion')
export class ReglasConciliacionController {
  constructor(
    private readonly reglasConciliacionService: ReglasConciliacionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar reglas de conciliación' })
  @ApiOkResponse({ type: [ReglaConciliacionResponseDto] })
  buscar(@Query() query: ReglasConciliacionQueryDto) {
    return this.reglasConciliacionService.buscar(query);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Detalle de una regla de conciliación' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: ReglaConciliacionResponseDto })
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.reglasConciliacionService.buscarPorId(publicId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una regla de conciliación' })
  @ApiCreatedResponse({ type: ReglaConciliacionResponseDto })
  crear(
    @Body() dto: CreateReglaConciliacionDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.reglasConciliacionService.crear(dto, usuarioId);
  }

  @Put(':publicId')
  @ApiOperation({ summary: 'Actualizar una regla de conciliación' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: ReglaConciliacionResponseDto })
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateReglaConciliacionDto,
  ) {
    return this.reglasConciliacionService.actualizar(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiOperation({ summary: 'Activar o desactivar una regla' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Estatus actualizado.' })
  activarDesactivar(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.reglasConciliacionService.activarDesactivar(publicId);
  }
}
