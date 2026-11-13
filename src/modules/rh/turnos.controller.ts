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
import { TurnosService } from './turnos.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { TurnoResponseDto } from './dto/turno.response.dto';
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

@ApiTags('RH - Turnos')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/rh/turnos')
@Controller('rh/turnos')
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @Post()
  @ApiCreateDoc(TurnoResponseDto, 'turno')
  crear(@Body() dto: CreateTurnoDto) {
    return this.turnosService.crear(dto);
  }

  @Get()
  @ApiGetDoc(TurnoResponseDto, 'turnos')
  buscar() {
    return this.turnosService.buscar();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(TurnoResponseDto, 'turnos')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.turnosService.paginar(paginacionDto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('turno')
  activarDesactivar(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.turnosService.activarDesactivar(publicId);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(TurnoResponseDto, 'turno')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.turnosService.buscarPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('turno')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateTurnoDto,
  ) {
    return this.turnosService.actualizar(publicId, dto);
  }
}
