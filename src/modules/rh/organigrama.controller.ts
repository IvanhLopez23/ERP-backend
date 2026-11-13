import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { OrganigramaService } from './organigrama.service';
import { OrganigramaQueryDto } from './dto/organigrama.query.dto';
import { AsignarJefeDto } from './dto/asignar-jefe.dto';
import { OrganigramaNodoDto } from './dto/organigrama.response.dto';
import { PublicIdPipe } from '../../common/validation/public-id';

import {
  ApiBearerAuthDoc,
  ApiErrorResponses,
  ApiGetDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('RH - Organigrama')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/rh')
@Controller('rh/organigrama')
export class OrganigramaController {
  constructor(private readonly organigramaService: OrganigramaService) {}

  @Get()
  @ApiGetDoc(OrganigramaNodoDto, 'organigrama')
  obtener(@Query() query: OrganigramaQueryDto) {
    return this.organigramaService.obtenerOrganigrama(query);
  }

  @Patch('jefe/:publicId')
  @ApiUpdateDoc('jefe del empleado')
  asignarJefe(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: AsignarJefeDto,
  ) {
    return this.organigramaService.asignarJefe(publicId, dto);
  }
}
