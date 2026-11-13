import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Query,
  Patch,
  UseGuards,
  Req,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePassUsuarioDto } from './dto/update-pass-usuario.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import {
  RequirePermission,
  SkipPermission,
} from '../auth/decorators/require-permission.decorator';
import { UploadsService } from '../uploads/uploads.service';
import { createMulterOptions } from '../uploads/config/multer.config';
import { PublicIdPipe } from '../../common/validation/public-id';
import { UsuarioResponseDto } from './dto/usuario.response.dto';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('Usuarios')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/configuraciones/usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post()
  @ApiCreateDoc(UsuarioResponseDto, 'usuario')
  @UseInterceptors(FileInterceptor('archivo', createMulterOptions('perfiles')))
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'nombreUsuario',
        'correo',
        'contrasena',
        'rolPublicId',
        'nombre',
        'apellidoPaterno',
        'apellidoMaterno',
      ],
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Foto de perfil (opcional)',
        },
        nombreUsuario: { type: 'string', example: 'usuario_admin' },
        correo: { type: 'string', example: 'admin@correo.com' },
        contrasena: { type: 'string', example: 'ClaveSegura123' },
        rolPublicId: {
          type: 'string',
          format: 'uuid',
          example: '0199a000-0000-7000-8000-000000000001',
        },
        nombre: {
          type: 'string',
          example: 'Juan',
          description: 'Nombre del perfil',
        },
        apellidoPaterno: { type: 'string', example: 'Pérez' },
        apellidoMaterno: { type: 'string', example: 'Gómez' },
        genero: { type: 'string', nullable: true, example: 'M' },
        fechaNacimiento: {
          type: 'string',
          format: 'date',
          nullable: true,
          example: '1990-05-15',
        },
      },
    },
  })
  async crear(
    @Req() req: Request,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    if (req.headers['content-type']?.includes('multipart')) {
      const body = req.body as Record<string, any>;

      const perfil = new CreatePerfilDto();
      perfil.nombre = body.nombre;
      perfil.apellidoPaterno = body.apellidoPaterno;
      perfil.apellidoMaterno = body.apellidoMaterno;
      if (body.genero) perfil.genero = body.genero;
      if (body.fechaNacimiento)
        perfil.fechaNacimiento = new Date(body.fechaNacimiento);
      if (archivo)
        perfil.foto = this.uploadsService.guardarImagen(archivo, 'perfiles');

      const dto = new CreateUsuarioDto();
      dto.nombreUsuario = body.nombreUsuario;
      dto.correo = body.correo;
      dto.contrasena = body.contrasena;
      dto.rolPublicId = body.rolPublicId;
      dto.perfil = perfil;

      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      if (errors.length > 0) throw new BadRequestException(errors);

      return this.usuariosService.crear(dto);
    }

    const dto = plainToClass(CreateUsuarioDto, req.body);
    if (archivo) {
      dto.perfil = dto.perfil || ({} as CreatePerfilDto);
      dto.perfil.foto = this.uploadsService.guardarImagen(archivo, 'perfiles');
    }

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) throw new BadRequestException(errors);

    return this.usuariosService.crear(dto);
  }

  @Get()
  @ApiGetDoc(UsuarioResponseDto, 'usuarios')
  buscar() {
    return this.usuariosService.buscar();
  }

  @Get('me/permisos')
  @SkipPermission()
  buscarMisPermisos(@GetUser('internalId') usuarioId: number) {
    return this.usuariosService.buscarPermisos(usuarioId);
  }

  @Get('paginacion')
  @ApiGetPagedDoc(UsuarioResponseDto, 'usuarios')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.usuariosService.paginado(paginacionDto);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(UsuarioResponseDto, 'usuario')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.usuariosService.buscarPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('usuario')
  actualizar(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.actualizar(publicId, updateUsuarioDto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('usuario')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.usuariosService.actualizarActivo(publicId);
  }

  @Patch('contrasena/:publicId')
  @ApiUpdateDoc('usuario')
  actualizarContrasena(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body() updatePassUsuarioDto: UpdatePassUsuarioDto,
  ) {
    return this.usuariosService.actualizarContrasena(
      publicId,
      updatePassUsuarioDto,
    );
  }

  @Patch('perfil/:publicId')
  @ApiUpdateDoc('usuario')
  @UseInterceptors(FileInterceptor('archivo', createMulterOptions('perfiles')))
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre', 'apellidoPaterno', 'apellidoMaterno'],
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Foto de perfil (opcional)',
        },
        nombre: { type: 'string', example: 'Juan' },
        apellidoPaterno: { type: 'string', example: 'Pérez' },
        apellidoMaterno: { type: 'string', example: 'Gómez' },
        genero: { type: 'string', nullable: true, example: 'M' },
        fechaNacimiento: {
          type: 'string',
          format: 'date',
          nullable: true,
          example: '1990-05-15',
        },
      },
    },
  })
  async actualizarPerfil(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Req() req: Request,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    if (req.headers['content-type']?.includes('multipart')) {
      const body = req.body as Record<string, any>;

      const perfil = new CreatePerfilDto();
      perfil.nombre = body.nombre;
      perfil.apellidoPaterno = body.apellidoPaterno;
      perfil.apellidoMaterno = body.apellidoMaterno;
      if (body.genero) perfil.genero = body.genero;
      if (body.fechaNacimiento)
        perfil.fechaNacimiento = new Date(body.fechaNacimiento);
      if (archivo)
        perfil.foto = this.uploadsService.guardarImagen(archivo, 'perfiles');

      const errors = await validate(perfil, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      if (errors.length > 0) throw new BadRequestException(errors);

      return this.usuariosService.actualizarPerfil(publicId, perfil);
    }

    const perfil = plainToClass(CreatePerfilDto, req.body);
    if (archivo) {
      perfil.foto = this.uploadsService.guardarImagen(archivo, 'perfiles');
    }

    const errors = await validate(perfil, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) throw new BadRequestException(errors);

    return this.usuariosService.actualizarPerfil(publicId, perfil);
  }

  @Put('perfil/:publicId/foto')
  @ApiOperation({ summary: 'Actualizar foto de perfil del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Foto de perfil actualizada correctamente.',
  })
  actualizarFoto(
    @Param('publicId', PublicIdPipe) publicId: string,
    @Body('foto') foto: string,
  ) {
    return this.usuariosService.actualizarPerfil(publicId, { foto } as any);
  }
}
