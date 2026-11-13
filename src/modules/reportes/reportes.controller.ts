import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import {
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
import { ReportesService } from './reportes.service';
import { EmpleadosReporteQueryDto } from './dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { ApiBearerAuthDoc, ApiErrorResponses } from '../../common/decorators';

@ApiTags('RH - Reportes')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/rh/empleados')
@Controller('rh/reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('empleados/excel')
  @ApiOperation({ summary: 'Exportar la lista de empleados a Excel' })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiResponse({
    status: 200,
    description: 'Archivo Excel con la lista de empleados.',
  })
  async descargarExcel(
    @Query() query: EmpleadosReporteQueryDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const { buffer, nombreArchivo } =
      await this.reportesService.generarExcelEmpleados(query);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('empleados/:publicId/ficha')
  @ApiOperation({
    summary: 'Ficha del empleado en PDF (carta de presentación)',
  })
  @ApiParam({
    name: 'publicId',
    description: 'publicId del empleado',
    type: String,
    format: 'uuid',
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Ficha del empleado en formato PDF tamaño A4.',
  })
  async ficha(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const { buffer, nombreArchivo } =
      await this.reportesService.generarFichaPdf(publicId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
