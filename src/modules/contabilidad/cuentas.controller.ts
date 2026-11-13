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
import { CuentasService } from './cuentas.service';
import { CreateCuentaContableDto } from './dto/create-cuenta-contable.dto';
import { UpdateCuentaContableDto } from './dto/update-cuenta-contable.dto';
import { CuentaContableResponseDto } from './dto/cuenta-contable.response.dto';
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

@ApiTags('Contabilidad - Cuentas')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/contabilidad/cuentas')
@Controller('contabilidad/cuentas')
export class CuentasController {
  constructor(private readonly cuentasService: CuentasService) {}

  @Post()
  @ApiCreateDoc(CuentaContableResponseDto, 'cuenta contable')
  crear(@Body() dto: CreateCuentaContableDto) {
    return this.cuentasService.crear(dto);
  }

  @Get()
  @ApiGetDoc(CuentaContableResponseDto, 'cuentas contables')
  buscar() {
    return this.cuentasService.buscar();
  }

  @Get('arbol')
  @ApiGetDoc(CuentaContableResponseDto, 'árbol de cuentas')
  buscarArbol() {
    return this.cuentasService.buscarArbol();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(CuentaContableResponseDto, 'cuentas contables')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.cuentasService.paginar(paginacionDto);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(CuentaContableResponseDto, 'cuenta contable')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.cuentasService.buscarPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('cuenta contable')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateCuentaContableDto,
  ) {
    return this.cuentasService.actualizar(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('cuenta contable')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.cuentasService.activarDesactivar(publicId);
  }
}
