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
import { RefaccionesService } from './refacciones.service';
import { CreateRefaccionDto } from './dto/create-refaccion.dto';
import { UpdateRefaccionDto } from './dto/update-refaccion.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { RefaccionResponseDto } from './dto/refaccion.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Mantenimiento - Refacciones')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/mantenimiento/refacciones')
@Controller('mantenimiento/refacciones')
export class RefaccionesController {
  constructor(private readonly refaccionesService: RefaccionesService) {}

  @Post()
  @ApiCreateDoc(RefaccionResponseDto, 'refacción')
  crear(@Body() dto: CreateRefaccionDto) {
    return this.refaccionesService.crearRefaccion(dto);
  }

  @Get()
  @ApiGetDoc(RefaccionResponseDto, 'refacciones')
  buscar() {
    return this.refaccionesService.buscarRefacciones();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(RefaccionResponseDto, 'refacciones')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.refaccionesService.paginarRefacciones(paginacionDto);
  }

  @Get('bajo-stock')
  @ApiGetDoc(RefaccionResponseDto, 'refacciones')
  buscarBajoStock() {
    return this.refaccionesService.buscarRefaccionesBajoStock();
  }

  @Get(':publicId')
  @ApiGetDetailDoc(RefaccionResponseDto, 'refacción')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.refaccionesService.buscarRefaccionPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('refacción')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateRefaccionDto,
  ) {
    return this.refaccionesService.actualizarRefaccion(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('refacción')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.refaccionesService.activarDesactivarRefaccion(publicId);
  }
}
