import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ReportesContablesService } from './reportes-contables.service';
import { ReporteContableQueryDto } from './dto/reporte-contable.query.dto';
import { MayorQueryDto } from './dto/mayor.query.dto';
import {
  AuxiliarClientesQueryDto,
  AuxiliarProveedoresQueryDto,
} from './dto/auxiliar.query.dto';
import {
  ExportarReporteQueryDto,
  REPORTES_EXPORTABLES,
} from './dto/exportar-reporte.query.dto';
import { IvaMensualQueryDto } from './dto/iva-mensual.query.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { CentroCostoReporteQueryDto } from './dto/centro-costo-reporte.query.dto';
import {
  CentroCostoDetalleResponseDto,
  CentroCostoReporteResponseDto,
} from './dto/centro-costo-reporte.response.dto';
import { PresupuestoCentroReporteQueryDto } from './dto/presupuesto-centro-reporte.query.dto';
import { PresupuestoCentroReporteResponseDto } from './dto/presupuesto-centro-reporte.response.dto';
import {
  BalanceGeneralResponseDto,
  BalanzaResponseDto,
  EstadoResultadosResponseDto,
  MayorResponseDto,
} from './dto/reportes.response.dto';
import { IvaMensualResponseDto, IvaResponseDto } from './dto/iva.response.dto';
import {
  ApiBearerAuthDoc,
  ApiErrorResponses,
  ApiGetDoc,
} from '../../common/decorators';

@ApiTags('Contabilidad - Reportes')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/contabilidad/reportes')
@Controller('contabilidad/reportes')
export class ReportesContablesController {
  constructor(
    private readonly reportesContablesService: ReportesContablesService,
  ) {}

  @Get('balanza')
  @ApiGetDoc(BalanzaResponseDto, 'balanza de comprobación')
  balanza(@Query() query: ReporteContableQueryDto) {
    return this.reportesContablesService.balanza(query);
  }

  @Get('estado-resultados')
  @ApiGetDoc(EstadoResultadosResponseDto, 'estado de resultados')
  estadoResultados(@Query() query: ReporteContableQueryDto) {
    return this.reportesContablesService.estadoResultados(query);
  }

  @Get('balance-general')
  @ApiGetDoc(BalanceGeneralResponseDto, 'balance general')
  balanceGeneral(@Query() query: ReporteContableQueryDto) {
    return this.reportesContablesService.balanceGeneral(query);
  }

  @Get('mayor')
  @ApiOperation({ summary: 'Mayor contable por cuenta' })
  @ApiOkResponse({ type: MayorResponseDto })
  mayor(@Query() query: MayorQueryDto) {
    return this.reportesContablesService.mayor(query);
  }

  @Get('iva')
  @ApiOperation({
    summary: 'IVA trasladado, IVA acreditable y neto por pagar',
  })
  @ApiOkResponse({ type: IvaResponseDto })
  iva(@Query() query: ReporteContableQueryDto) {
    return this.reportesContablesService.iva(query);
  }

  @Get('iva/mensual')
  @ApiOperation({ summary: 'Resumen mensual de IVA del ejercicio fiscal' })
  @ApiOkResponse({ type: IvaMensualResponseDto })
  ivaMensual(@Query() query: IvaMensualQueryDto) {
    return this.reportesContablesService.ivaMensual(query);
  }

  @Get('centros-costo')
  @ApiOperation({ summary: 'Ingresos, gastos y utilidad por centro de costo' })
  @ApiOkResponse({ type: CentroCostoReporteResponseDto })
  centrosCosto(@Query() query: CentroCostoReporteQueryDto) {
    return this.reportesContablesService.centrosCosto(query);
  }

  @Get('centros-costo/:publicId')
  @ApiOperation({ summary: 'Detalle de movimientos por centro de costo' })
  @ApiParam({ name: 'publicId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: CentroCostoDetalleResponseDto })
  centrosCostoDetalle(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Query() query: CentroCostoReporteQueryDto,
  ) {
    return this.reportesContablesService.centrosCostoDetalle(publicId, query);
  }

  @Get('presupuesto-centros-costo')
  @ApiOperation({ summary: 'Presupuesto vs real por centro de costo' })
  @ApiOkResponse({ type: PresupuestoCentroReporteResponseDto })
  presupuestoCentrosCosto(@Query() query: PresupuestoCentroReporteQueryDto) {
    return this.reportesContablesService.presupuestoCentrosCosto(query);
  }

  @Get('auxiliar-clientes')
  @ApiOperation({
    summary:
      'Auxiliar de clientes. Con clienteId devuelve movimientos; sin él, resumen por cliente.',
  })
  @ApiOkResponse({
    description:
      'Detalle de movimientos o resumen por cliente según se envíe clienteId.',
  })
  auxiliarClientes(@Query() query: AuxiliarClientesQueryDto) {
    return this.reportesContablesService.auxiliarClientes(query);
  }

  @Get('auxiliar-proveedores')
  @ApiOperation({
    summary:
      'Auxiliar de proveedores. Con proveedorId devuelve movimientos; sin él, resumen por proveedor.',
  })
  @ApiOkResponse({
    description:
      'Detalle de movimientos o resumen por proveedor según se envíe proveedorId.',
  })
  auxiliarProveedores(@Query() query: AuxiliarProveedoresQueryDto) {
    return this.reportesContablesService.auxiliarProveedores(query);
  }

  @Get(':reporte/exportar')
  @ApiOperation({
    summary: 'Exportar un reporte contable a Excel o PDF',
  })
  @ApiParam({
    name: 'reporte',
    enum: [...REPORTES_EXPORTABLES],
    description: 'Reporte a exportar',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
  )
  @ApiResponse({
    status: 200,
    description: 'Archivo del reporte en el formato solicitado.',
  })
  async exportar(
    @Param('reporte') reporte: string,
    @Query() query: ExportarReporteQueryDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const { buffer, nombreArchivo, contentType } =
      await this.reportesContablesService.exportar(reporte, query);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
