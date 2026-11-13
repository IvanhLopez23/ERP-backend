import {
  Controller,
  BadRequestException,
  Get,
  Post,
  Patch,
  Query,
  Put,
  UseGuards,
  Param,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { UploadsService } from '../uploads/uploads.service';
import { createMulterOptions } from '../uploads/config/multer.config';
import { ProductoResponseDto } from './dto/producto.response.dto';
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

@ApiTags('Almacén - Productos')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/almacen/productos')
@Controller('almacen/productos')
export class ProductosController {
  constructor(
    private readonly productosService: ProductosService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('archivo', createMulterOptions('productos')))
  @ApiCreateDoc(ProductoResponseDto, 'producto')
  @ApiOperation({ summary: 'Crear un producto con foto opcional' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'codigo',
        'nombre',
        'precioCosto',
        'precioVenta',
        'unidadMedidaId',
      ],
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Imagen opcional del producto',
        },
        codigo: { type: 'string', example: 'PROD-001' },
        nombre: { type: 'string', example: 'Laptop HP ProBook' },
        descripcion: { type: 'string', nullable: true },
        precioCosto: { type: 'number', example: 15000.5 },
        precioVenta: { type: 'number', example: 19999.99 },
        unidadMedidaId: {
          type: 'string',
          format: 'uuid',
          description:
            'publicId de la unidad de medida (también se acepta unidadMedidaPublicId)',
        },
        categoriaId: {
          type: 'string',
          format: 'uuid',
          nullable: true,
          description:
            'publicId de la categoría (también se acepta categoriaPublicId)',
        },
      },
    },
  })
  async crear(
    @Req() req: Request,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    const dto = plainToInstance(
      CreateProductoDto,
      this.normalizarBody(req.body as Record<string, unknown>),
    );
    if (archivo)
      dto.foto = this.uploadsService.guardarImagen(archivo, 'productos');
    await this.validarDto(dto);
    return this.productosService.crearProducto(dto);
  }

  @Get()
  @ApiGetDoc(ProductoResponseDto, 'productos')
  buscar() {
    return this.productosService.buscarProductos();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(ProductoResponseDto, 'productos')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.productosService.paginarProductos(paginacionDto);
  }

  @Get('categorias')
  @ApiGetDoc(CategoriaProductoResponseDto, 'categorías')
  listarCategorias() {
    return this.productosService.listarCategorias();
  }

  @Get(':publicId')
  @ApiGetDetailDoc(ProductoResponseDto, 'producto')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.productosService.buscarProductoPorId(publicId);
  }

  @Put(':publicId')
  @UseInterceptors(FileInterceptor('archivo', createMulterOptions('productos')))
  @ApiUpdateDoc('producto')
  @ApiOperation({ summary: 'Actualizar un producto con foto opcional' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Nueva imagen opcional del producto',
        },
        codigo: { type: 'string' },
        nombre: { type: 'string' },
        descripcion: { type: 'string', nullable: true },
        precioCosto: { type: 'number' },
        precioVenta: { type: 'number' },
        unidadMedidaId: {
          type: 'string',
          format: 'uuid',
          description:
            'publicId de la unidad de medida (también se acepta unidadMedidaPublicId)',
        },
        categoriaId: {
          type: 'string',
          format: 'uuid',
          nullable: true,
          description:
            'publicId de la categoría (también se acepta categoriaPublicId)',
        },
      },
    },
  })
  async actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Req() req: Request,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    const dto = plainToInstance(
      UpdateProductoDto,
      this.normalizarBody(req.body as Record<string, unknown>),
    );
    if (archivo)
      dto.foto = this.uploadsService.guardarImagen(archivo, 'productos');
    await this.validarDto(dto);
    return this.productosService.actualizarProducto(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('producto')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.productosService.activarDesactivarProducto(publicId);
  }

  private normalizarBody(body: Record<string, unknown>) {
    const numberOrUndefined = (key: string) => {
      const item = body?.[key];
      return item === undefined || item === '' ? undefined : Number(item);
    };
    const strOrUndefined = (valor: unknown) =>
      typeof valor === 'string' && valor !== '' ? valor : undefined;

    // Acepta tanto `unidadMedidaId`/`categoriaId` como sus alias
    // `unidadMedidaPublicId`/`categoriaPublicId` (documentados antes en Swagger).
    const resto: Record<string, unknown> = { ...(body ?? {}) };
    const unidadMedidaPublicId = resto.unidadMedidaPublicId;
    const categoriaPublicId = resto.categoriaPublicId;
    delete resto.unidadMedidaPublicId;
    delete resto.categoriaPublicId;

    return {
      ...resto,
      precioCosto: numberOrUndefined('precioCosto'),
      precioVenta: numberOrUndefined('precioVenta'),
      unidadMedidaId:
        strOrUndefined(resto.unidadMedidaId) ??
        strOrUndefined(unidadMedidaPublicId),
      categoriaId:
        strOrUndefined(resto.categoriaId) ?? strOrUndefined(categoriaPublicId),
    };
  }

  private async validarDto(dto: CreateProductoDto | UpdateProductoDto) {
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) throw new BadRequestException(errors);
  }
}
