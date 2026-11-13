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
import { ImpuestosService } from './impuestos.service';
import { DeclararIvaDto } from './dto/declarar-iva.dto';
import { DeclaracionesIvaQueryDto } from './dto/declaraciones-iva.query.dto';
import { DeclaracionIvaResponseDto } from './dto/declaracion-iva.response.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { ApiBearerAuthDoc, ApiErrorResponses } from '../../common/decorators';

@ApiTags('Contabilidad - Impuestos')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/contabilidad/reportes')
@Controller('contabilidad/impuestos')
export class ImpuestosController {
  constructor(private readonly impuestosService: ImpuestosService) {}

  @Get('iva/declaraciones')
  @ApiOperation({ summary: 'Listar declaraciones de IVA' })
  @ApiOkResponse({ type: [DeclaracionIvaResponseDto] })
  listar(@Query() query: DeclaracionesIvaQueryDto) {
    return this.impuestosService.listar(query);
  }

  @Get('iva/declaraciones/:publicId')
  @ApiOperation({ summary: 'Detalle de una declaración de IVA' })
  @ApiParam({
    name: 'publicId',
    description: 'publicId de la declaración',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({ type: DeclaracionIvaResponseDto })
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.impuestosService.buscarPorId(publicId);
  }

  @Post('iva/declarar')
  @ApiOperation({
    summary:
      'Declarar el IVA de un mes y generar la póliza de pago/compensación',
  })
  @ApiCreatedResponse({ type: DeclaracionIvaResponseDto })
  declarar(
    @Body() dto: DeclararIvaDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.impuestosService.declarar(dto, usuarioId);
  }
}
