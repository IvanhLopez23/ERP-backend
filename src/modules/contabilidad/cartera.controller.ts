import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CarteraResumenService } from './cartera-resumen.service';
import { BackfillService } from './backfill.service';
import { CarteraResumenResponseDto } from './dto/cartera-resumen.response.dto';
import { AgingQueryDto } from './dto/aging-query.dto';
import { AgingResponseDto } from './dto/aging.response.dto';
import { BackfillDto } from './dto/backfill.dto';
import {
  ApiBearerAuthDoc,
  ApiErrorResponses,
  ApiGetDoc,
} from '../../common/decorators';

@ApiTags('Contabilidad - Cartera')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/contabilidad/cartera')
@Controller('contabilidad/cartera')
export class CarteraController {
  constructor(
    private readonly carteraResumenService: CarteraResumenService,
    private readonly backfillService: BackfillService,
  ) {}

  @Get('resumen')
  @ApiGetDoc(CarteraResumenResponseDto, 'resumen de cartera')
  resumen() {
    return this.carteraResumenService.resumen();
  }

  @Get('aging')
  @ApiGetDoc(AgingResponseDto, 'antigüedad de saldos')
  aging(@Query() query: AgingQueryDto) {
    return this.carteraResumenService.aging(query.fechaCorte);
  }

  @Post('backfill')
  @ApiOperation({
    summary:
      'Generar CxC/CxP y pólizas para ventas/compras existentes (idempotente)',
  })
  @ApiResponse({ status: 201, description: 'Backfill ejecutado.' })
  backfill(@Body() dto: BackfillDto) {
    return this.backfillService.ejecutar(dto);
  }
}
