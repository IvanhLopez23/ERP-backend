import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Query,
  UseGuards,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { SolicitudesPermisoService } from './solicitudes-permiso.service';
import { CreateSolicitudPermisoDto } from './dto/create-solicitud-permiso.dto';
import { UpdateEstatusPermisoDto } from './dto/update-estatus-permiso.dto';
import { BuscarSolicitudesPermisoDto } from './dto/buscar-solicitudes-permiso.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { SolicitudPermisoResponseDto } from './dto/solicitud-permiso.response.dto';
import { UploadsService } from '../uploads/uploads.service';
import { createMulterOptions } from '../uploads/config/multer.config';
import { documentoFileFilter } from '../uploads/helpers/file-filter.helper';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('RH - Solicitudes de Permiso')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/rh/solicitudes-permiso')
@Controller('rh/solicitudes-permiso')
export class SolicitudesPermisoController {
  constructor(
    private readonly solicitudesPermisoService: SolicitudesPermisoService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post()
  @ApiCreateDoc(SolicitudPermisoResponseDto, 'solicitud de permiso')
  @UseInterceptors(
    FileInterceptor(
      'archivo',
      createMulterOptions('permisos', documentoFileFilter, 5 * 1024 * 1024),
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['empleadoId', 'tipo', 'fechaInicio', 'fechaFin', 'motivo'],
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description:
            'Comprobante médico o carta de vacaciones firmada (PDF o imagen)',
        },
        empleadoId: { type: 'string', format: 'uuid' },
        tipo: {
          type: 'string',
          enum: ['enfermedad', 'personal', 'vacaciones', 'otro'],
        },
        fechaInicio: { type: 'string', format: 'date' },
        fechaFin: { type: 'string', format: 'date' },
        motivo: { type: 'string' },
      },
    },
  })
  crear(
    @Body() dto: CreateSolicitudPermisoDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    if (archivo) {
      dto.comprobante = this.uploadsService.guardarImagen(archivo, 'permisos');
    }
    return this.solicitudesPermisoService.crearSolicitudPermiso(dto);
  }

  @Get()
  @ApiGetPagedDoc(SolicitudPermisoResponseDto, 'solicitudes de permiso')
  buscar(@Query() query: BuscarSolicitudesPermisoDto) {
    return this.solicitudesPermisoService.buscarSolicitudesPermiso(
      query,
      query.empleadoId,
      query.estatus,
    );
  }

  @Patch('comprobante/:publicId')
  @ApiUpdateDoc('solicitud de permiso')
  @UseInterceptors(
    FileInterceptor(
      'archivo',
      createMulterOptions('permisos', documentoFileFilter, 5 * 1024 * 1024),
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['archivo'],
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description:
            'Comprobante médico o carta de vacaciones firmada (PDF o imagen)',
        },
      },
    },
  })
  actualizarComprobante(
    @Param('publicId', PublicIdPipe) publicId: string,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    if (!archivo) {
      throw new BadRequestException('El archivo es obligatorio');
    }
    return this.solicitudesPermisoService.actualizarComprobante(
      publicId,
      this.uploadsService.guardarImagen(archivo, 'permisos'),
    );
  }

  @Get(':publicId')
  @ApiGetDetailDoc(SolicitudPermisoResponseDto, 'solicitud de permiso')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.solicitudesPermisoService.buscarSolicitudPermisoPorId(publicId);
  }

  @Patch('estatus/:publicId')
  @ApiUpdateDoc('solicitud de permiso')
  actualizarEstatus(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() dto: UpdateEstatusPermisoDto,
    @GetUser('internalId') usuarioId: number,
  ) {
    return this.solicitudesPermisoService.actualizarEstatusPermiso(
      publicId,
      dto,
      usuarioId,
    );
  }
}
