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
import { CxpService } from './cxp.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { CreatePagoMultipleDto } from './dto/create-pago-multiple.dto';
import { CreateCxpManualDto } from './dto/create-cxp-manual.dto';
import { FiltrarCarteraDto } from './dto/filtrar-cartera.dto';
import { CuentaPorPagarResponseDto } from './dto/cuenta-por-pagar.response.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import {
  ApiBearerAuthDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Contabilidad - Cuentas por pagar')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/contabilidad/cxp')
@Controller('contabilidad/cxp')
export class CxpController {
  constructor(private readonly cxpService: CxpService) {}

  @Get()
  @ApiGetDoc(CuentaPorPagarResponseDto, 'cuentas por pagar')
  buscar() {
    return this.cxpService.buscar();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(CuentaPorPagarResponseDto, 'cuentas por pagar')
  paginado(@Query() query: FiltrarCarteraDto) {
    return this.cxpService.paginar(query);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(CuentaPorPagarResponseDto, 'cuenta por pagar')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.cxpService.buscarPorId(publicId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una cuenta por pagar manual' })
  @ApiCreatedResponse({ description: 'Cuenta por pagar creada.' })
  crearManual(
    @Body() dto: CreateCxpManualDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.cxpService.crearManual(dto, usuarioId);
  }

  @Post('pagos-multiples')
  @ApiOperation({
    summary: 'Registrar un pago aplicado a varias cuentas por pagar',
  })
  @ApiCreatedResponse({ description: 'Pago múltiple registrado.' })
  registrarPagoMultiple(
    @Body() dto: CreatePagoMultipleDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.cxpService.registrarPagoMultiple(dto, usuarioId);
  }

  @Post(':publicId/pagos')
  @ApiUpdateDoc('cuenta por pagar')
  registrarPago(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: CreatePagoDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.cxpService.registrarPago(publicId, dto, usuarioId);
  }

  @Patch(':publicId/cancelar')
  @ApiUpdateDoc('cuenta por pagar')
  cancelar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.cxpService.cancelar(publicId, usuarioId);
  }
}
