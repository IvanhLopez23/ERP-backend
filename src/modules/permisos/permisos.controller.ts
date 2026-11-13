import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { PermisosService } from './permisos.service';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CrearPermisoFullDto } from './dto/crear-permisos-full.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ActualizarPermisosRolDto } from './dto/actualizar-permisos-rol.dto';
import { PermisoResponseDto } from './dto/permiso.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDoc,
} from '../../common/decorators';

@ApiTags('Permisos')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/configuraciones/permisos')
@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Post()
  @ApiCreateDoc(PermisoResponseDto, 'permiso')
  create(@Body() createPermisoDto: CreatePermisoDto) {
    return this.permisosService.crearPermisos(createPermisoDto);
  }

  @Get()
  @ApiGetDoc(PermisoResponseDto, 'permisos')
  buscar() {
    return this.permisosService.buscar();
  }

  @Get('rol')
  @ApiGetDoc(PermisoResponseDto, 'permisos')
  buscarPorRolId(@Query('rolId') rolId: string) {
    return this.permisosService.buscarPorRolId(rolId);
  }

  @Post('full')
  @ApiOperation({ summary: 'Crear permisos masivos para usuarios y roles' })
  @ApiBody({
    type: [CrearPermisoFullDto], // <-- Esto le dice a Swagger que es una matriz/arreglo de objetos
    description: 'Arreglo con la configuración de permisos por rol y usuario',
  })
  async crearPermisosFull(
    @Body() payload: CrearPermisoFullDto[],
    @GetUser('internalId') usuarioId: number,
  ) {
    return await this.permisosService.crearPermisosFull(payload, usuarioId);
  }

  @Put('rol')
  reemplazarPermisosRol(@Body() dto: ActualizarPermisosRolDto) {
    return this.permisosService.reemplazarPermisosRol(dto);
  }
}
