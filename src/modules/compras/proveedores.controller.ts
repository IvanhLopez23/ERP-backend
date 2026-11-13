import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Query,
  Put,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ComprasService } from './compras.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { ProveedorResponseDto } from './dto/proveedor.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Compras - Proveedores')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/compras/proveedores')
@Controller('compras/proveedores')
export class ProveedoresController {
  constructor(private readonly comprasService: ComprasService) {}

  @Post()
  @ApiCreateDoc(ProveedorResponseDto, 'proveedor')
  crear(@Body() dto: CreateProveedorDto) {
    return this.comprasService.crearProveedor(dto);
  }

  @Get()
  @ApiGetDoc(ProveedorResponseDto, 'proveedores')
  buscar() {
    return this.comprasService.buscarProveedores();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(ProveedorResponseDto, 'proveedores')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.comprasService.paginarProveedores(paginacionDto);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(ProveedorResponseDto, 'proveedor')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.comprasService.buscarProveedorPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('proveedor')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateProveedorDto,
  ) {
    return this.comprasService.actualizarProveedor(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('proveedor')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.comprasService.activarDesactivarProveedor(publicId);
  }
}
