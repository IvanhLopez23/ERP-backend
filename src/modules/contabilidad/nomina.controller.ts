import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { NominaService } from './nomina.service';
import { CreateNominaDto } from './dto/create-nomina.dto';
import { NominaPreviewQueryDto, NominaQueryDto } from './dto/nomina.query.dto';
import {
  NominaPreviewResponseDto,
  NominaResponseDto,
} from './dto/nomina.response.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { ApiBearerAuthDoc, ApiErrorResponses } from '../../common/decorators';

@ApiTags('Contabilidad - Nómina')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/contabilidad/nomina')
@Controller('contabilidad/nomina')
export class NominaController {
  constructor(private readonly nominaService: NominaService) {}

  @Get('preview')
  @ApiOperation({
    summary: 'Previsualizar la nómina del periodo (empleados activos)',
  })
  @ApiOkResponse({ type: NominaPreviewResponseDto })
  preview(@Query() query: NominaPreviewQueryDto) {
    return this.nominaService.preview(query);
  }

  @Get()
  @ApiOperation({ summary: 'Listar nóminas contabilizadas' })
  @ApiOkResponse({ type: [NominaResponseDto] })
  buscar(@Query() query: NominaQueryDto) {
    return this.nominaService.buscar(query);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Detalle de una nómina con póliza y centros' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: NominaResponseDto })
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.nominaService.buscarPorId(publicId);
  }

  @Post()
  @ApiOperation({
    summary: 'Contabilizar la nómina del periodo (idempotente por año/mes)',
  })
  @ApiCreatedResponse({ type: NominaResponseDto })
  crear(
    @Body() dto: CreateNominaDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.nominaService.crear(dto, usuarioId);
  }
}
