import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PublicIdPipe } from '../../common/validation/public-id';
import { RoleResponseDto } from './dto/role.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Roles')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/configuraciones/roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiCreateDoc(RoleResponseDto, 'rol')
  crear(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.crear(createRoleDto);
  }

  @Get()
  @ApiGetDoc(RoleResponseDto, 'roles')
  buscar() {
    return this.rolesService.buscar();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(RoleResponseDto, 'roles')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.rolesService.paginado(paginacionDto);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(RoleResponseDto, 'rol')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.rolesService.buscarPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('rol')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.actualizar(publicId, updateRoleDto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('rol')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.rolesService.actualizarActivo(publicId);
  }
}
