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
import { CategoriasService } from './categorias.service';
import { CreateCategoriaProductoDto } from './dto/create-categoria-producto.dto';
import { UpdateCategoriaProductoDto } from './dto/update-categoria-producto.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { CategoriaProductoResponseDto } from './dto/categoria-producto.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Almacén - Categorías')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/almacen/categorias')
@Controller('almacen/categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Post()
  @ApiCreateDoc(CategoriaProductoResponseDto, 'categoría')
  crear(@Body() dto: CreateCategoriaProductoDto) {
    return this.categoriasService.crearCategoria(dto);
  }

  @Get()
  @ApiGetDoc(CategoriaProductoResponseDto, 'categorías')
  buscar() {
    return this.categoriasService.buscarCategorias();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(CategoriaProductoResponseDto, 'categorías')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.categoriasService.paginarCategorias(paginacionDto);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(CategoriaProductoResponseDto, 'categoría')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.categoriasService.buscarCategoriaPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('categoría')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateCategoriaProductoDto,
  ) {
    return this.categoriasService.actualizarCategoria(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('categoría')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.categoriasService.activarDesactivarCategoria(publicId);
  }
}
