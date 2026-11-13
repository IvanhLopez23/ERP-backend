import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiRequestTimeoutResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { VacacionesService } from './vacaciones.service';
import { CreatePoliticaVacacionalDto } from './dto/create-politica-vacacional.dto';
import { UpdatePoliticaVacacionalDto } from './dto/update-politica-vacacional.dto';
import { ConsultaSaldoVacacionalDto } from './dto/consulta-saldo-vacacional.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { PoliticaVacacionalResponseDto } from './dto/politica-vacacional.response.dto';
import { PeriodoVacacionalResponseDto } from './dto/periodo-vacacional.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('RH - Vacaciones')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/rh/vacaciones')
@Controller('rh/vacaciones')
export class VacacionesController {
  constructor(private readonly vacacionesService: VacacionesService) {}

  @Get('saldo')
  obtenerSaldo(@Query() query: ConsultaSaldoVacacionalDto) {
    return this.vacacionesService.obtenerSaldoVacacional(query);
  }

  @Get('historial')
  @ApiGetDoc(PeriodoVacacionalResponseDto, 'periodos vacacionales')
  obtenerHistorial(@Query('empleadoId', PublicIdPipe) empleadoId: string) {
    return this.vacacionesService.buscarHistorialVacacional(empleadoId);
  }

  @Get('politicas')
  @ApiGetDoc(PoliticaVacacionalResponseDto, 'políticas vacacionales')
  buscarPoliticas() {
    return this.vacacionesService.buscarPoliticasVacacionales();
  }

  @Post('politicas')
  @ApiCreateDoc(PoliticaVacacionalResponseDto, 'política vacacional')
  crearPolitica(@Body() dto: CreatePoliticaVacacionalDto) {
    return this.vacacionesService.crearPoliticaVacacional(dto);
  }

  @Put('politicas')
  @ApiUpdateDoc('política vacacional')
  actualizarPolitica(
    @Query('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdatePoliticaVacacionalDto,
  ) {
    return this.vacacionesService.actualizarPoliticaVacacional(publicId, dto);
  }
}
