import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CortesInventarioService } from './cortes-inventario.service';
import { CreateCorteInventarioDto } from './dto/create-corte-inventario.dto';
import { BuscarCortesInventarioDto } from './dto/buscar-cortes-inventario.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { CorteInventarioResponseDto } from './dto/corte-inventario.response.dto';
import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDoc,
  ApiGetPagedDoc,
} from '../../common/decorators';

@ApiTags('Almacén - Cortes de inventario')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/almacen/inventario')
@Controller('almacen/inventario/cortes')
export class CortesInventarioController {
  constructor(
    private readonly cortesInventarioService: CortesInventarioService,
  ) {}

  @Post()
  @ApiCreateDoc(CorteInventarioResponseDto, 'corte de inventario')
  crear(
    @Body() dto: CreateCorteInventarioDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.cortesInventarioService.crearCorte(dto, usuarioId);
  }

  @Get()
  @ApiGetPagedDoc(CorteInventarioResponseDto, 'cortes de inventario')
  buscar(@Query() query: BuscarCortesInventarioDto) {
    return this.cortesInventarioService.buscarCortes(query);
  }

  @Get(':publicId/csv')
  @ApiGetDoc(CorteInventarioResponseDto, 'corte de inventario')
  async csv(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Res() res: Response,
  ) {
    const { nombreArchivo, contenido } =
      await this.cortesInventarioService.generarCsv(publicId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${nombreArchivo}"`,
    );
    res.send(`\uFEFF${contenido}`);
  }

  @Get(':publicId')
  @ApiGetDoc(CorteInventarioResponseDto, 'corte de inventario')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.cortesInventarioService.buscarCortePorId(publicId);
  }
}
