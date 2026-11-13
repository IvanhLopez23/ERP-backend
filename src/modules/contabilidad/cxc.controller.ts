import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CxcService } from './cxc.service';
import { CreateCobroDto } from './dto/create-cobro.dto';
import { CreateCobroMultipleDto } from './dto/create-cobro-multiple.dto';
import { CreateCxcManualDto } from './dto/create-cxc-manual.dto';
import { FiltrarCarteraDto } from './dto/filtrar-cartera.dto';
import { CuentaPorCobrarResponseDto } from './dto/cuenta-por-cobrar.response.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import {
  ApiBearerAuthDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Contabilidad - Cuentas por cobrar')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/contabilidad/cxc')
@Controller('contabilidad/cxc')
export class CxcController {
  constructor(private readonly cxcService: CxcService) {}

  @Get()
  @ApiGetDoc(CuentaPorCobrarResponseDto, 'cuentas por cobrar')
  buscar() {
    return this.cxcService.buscar();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(CuentaPorCobrarResponseDto, 'cuentas por cobrar')
  paginado(@Query() query: FiltrarCarteraDto) {
    return this.cxcService.paginar(query);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(CuentaPorCobrarResponseDto, 'cuenta por cobrar')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.cxcService.buscarPorId(publicId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una cuenta por cobrar manual' })
  @ApiCreatedResponse({ description: 'Cuenta por cobrar creada.' })
  crearManual(
    @Body() dto: CreateCxcManualDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.cxcService.crearManual(dto, usuarioId);
  }

  @Post('cobros-multiples')
  @ApiOperation({
    summary: 'Registrar un cobro aplicado a varias cuentas por cobrar',
  })
  @ApiCreatedResponse({ description: 'Cobro múltiple registrado.' })
  registrarCobroMultiple(
    @Body() dto: CreateCobroMultipleDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.cxcService.registrarCobroMultiple(dto, usuarioId);
  }

  @Post(':publicId/cobros')
  @ApiUpdateDoc('cuenta por cobrar')
  registrarCobro(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: CreateCobroDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.cxcService.registrarCobro(publicId, dto, usuarioId);
  }

  @Patch(':publicId/cancelar')
  @ApiUpdateDoc('cuenta por cobrar')
  cancelar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.cxcService.cancelar(publicId, usuarioId);
  }
}
