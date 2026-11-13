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
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PeriodosService } from './periodos.service';
import { CreatePeriodoContableDto } from './dto/create-periodo-contable.dto';
import { UpdatePeriodoContableDto } from './dto/update-periodo-contable.dto';
import { PeriodoContableResponseDto } from './dto/periodo-contable.response.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Contabilidad - Periodos')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/contabilidad/periodos')
@Controller('contabilidad/periodos')
export class PeriodosController {
  constructor(private readonly periodosService: PeriodosService) {}

  @Post()
  @ApiCreateDoc(PeriodoContableResponseDto, 'periodo contable')
  crear(@Body() dto: CreatePeriodoContableDto) {
    return this.periodosService.crear(dto);
  }

  @Get()
  @ApiGetDoc(PeriodoContableResponseDto, 'periodos contables')
  buscar() {
    return this.periodosService.buscar();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(PeriodoContableResponseDto, 'periodos contables')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.periodosService.paginar(paginacionDto);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(PeriodoContableResponseDto, 'periodo contable')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.periodosService.buscarPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('periodo contable')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdatePeriodoContableDto,
  ) {
    return this.periodosService.actualizar(publicId, dto);
  }

  @Patch('cerrar/:publicId')
  @ApiUpdateDoc('periodo contable')
  cerrar(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.periodosService.cerrar(publicId);
  }

  @Patch('reabrir/:publicId')
  @ApiUpdateDoc('periodo contable')
  reabrir(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.periodosService.reabrir(publicId);
  }
}
