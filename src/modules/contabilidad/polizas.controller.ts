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
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PolizasService } from './polizas.service';
import { CreatePolizaDto } from './dto/create-poliza.dto';
import { UpdatePolizaDto } from './dto/update-poliza.dto';
import { PaginarPolizasDto } from './dto/paginar-polizas.dto';
import { PolizaResponseDto } from './dto/poliza.response.dto';
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

@ApiTags('Contabilidad - Pólizas')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/contabilidad/polizas')
@Controller('contabilidad/polizas')
export class PolizasController {
  constructor(private readonly polizasService: PolizasService) {}

  @Post()
  @ApiCreateDoc(PolizaResponseDto, 'póliza')
  crear(
    @Body() dto: CreatePolizaDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.polizasService.crear(dto, usuarioId);
  }

  @Get()
  @ApiGetDoc(PolizaResponseDto, 'pólizas')
  buscar() {
    return this.polizasService.buscar();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(PolizaResponseDto, 'pólizas')
  paginado(@Query() query: PaginarPolizasDto) {
    return this.polizasService.paginar(query);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(PolizaResponseDto, 'póliza')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.polizasService.buscarPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('póliza')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdatePolizaDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.polizasService.actualizar(publicId, dto, usuarioId);
  }

  @Patch('contabilizar/:publicId')
  @ApiUpdateDoc('póliza')
  contabilizar(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.polizasService.contabilizar(publicId);
  }

  @Patch('cancelar/:publicId')
  @ApiUpdateDoc('póliza')
  cancelar(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.polizasService.cancelar(publicId);
  }
}
