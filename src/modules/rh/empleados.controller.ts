import {
  Controller,
  BadRequestException,
  Get,
  Post,
  Body,
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
import { EmpleadosService } from './empleados.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { PublicIdPipe } from '../../common/validation/public-id';
import { EmpleadoResponseDto } from './dto/empleado.response.dto';
import { UploadsService } from '../uploads/uploads.service';
import { createMulterOptions } from '../uploads/config/multer.config';

import {
  ApiBearerAuthDoc,
  ApiCreateDoc,
  ApiErrorResponses,
  ApiGetDetailDoc,
  ApiGetDoc,
  ApiGetPagedDoc,
  ApiUpdateDoc,
} from '../../common/decorators';

@ApiTags('RH - Empleados')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('/rh/empleados')
@Controller('rh/empleados')
export class EmpleadosController {
  constructor(
    private readonly empleadosService: EmpleadosService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post()
  @ApiCreateDoc(EmpleadoResponseDto, 'empleado')
  @UseInterceptors(FileInterceptor('archivo', createMulterOptions('empleados')))
  @ApiOperation({ summary: 'Crear un empleado con foto opcional' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'codigo',
        'nombre',
        'apellidoPaterno',
        'departamentoId',
        'puestoId',
        'fechaIngreso',
        'tipoContrato',
        'fechaInicioContrato',
        'salarioContrato',
      ],
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Foto opcional del empleado',
        },
        codigo: { type: 'string', example: 'EMP-001' },
        rfc: { type: 'string', example: 'ABCD000101EFG' },
        curp: { type: 'string', example: 'ABCD000101EFGH01JK' },
        nss: { type: 'string', example: '123456789012' },
        nombre: { type: 'string', example: 'Juan' },
        apellidoPaterno: { type: 'string', example: 'Pérez' },
        apellidoMaterno: { type: 'string' },
        genero: { type: 'string', example: 'M' },
        fechaNacimiento: { type: 'string', format: 'date' },
        departamentoId: {
          type: 'string',
          format: 'uuid',
          example: '01a0b13f-fe3f-7797-bb8e-1265f4409c78',
        },
        puestoId: {
          type: 'string',
          format: 'uuid',
          example: '01a0b13f-fe44-7df7-bc75-39b1185a7061',
        },
        turnoId: {
          type: 'string',
          format: 'uuid',
          example: '01a0caf8-9ca9-7ae1-9b29-9ab88730a738',
        },
        fechaIngreso: { type: 'string', format: 'date', example: '2000-01-01' },
        tipoContrato: {
          type: 'string',
          enum: ['indeterminado', 'temporal', 'obra'],
          example: 'indeterminado',
        },
        fechaInicioContrato: {
          type: 'string',
          format: 'date',
          example: '2000-01-01',
        },
        fechaFinContrato: { type: 'string', format: 'date' },
        salarioContrato: { type: 'number', example: 25000 },
        telefono: { type: 'string', example: '123456789012' },
        correo: { type: 'string', example: 'correo@ticsa.mx' },
        direccion: { type: 'string', example: 'Calle Falsa 123' },
        usuarioId: {
          type: 'string',
          format: 'uuid',
          example: '01a0caf8-9ca9-7ae1-9b29-9ab88730a738',
        },
      },
    },
  })
  async crear(
    @Req() req: Request,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    const dto = plainToInstance(
      CreateEmpleadoDto,
      this.normalizarBody(req.body as Record<string, unknown>),
    );
    if (archivo)
      dto.foto = this.uploadsService.guardarImagen(archivo, 'empleados');
    await this.validarDto(dto);
    return this.empleadosService.crearEmpleado(dto);
  }

  @Get()
  @ApiGetDoc(EmpleadoResponseDto, 'empleados')
  buscar() {
    return this.empleadosService.buscarEmpleados();
  }

  @Get('paginacion')
  @ApiGetPagedDoc(EmpleadoResponseDto, 'empleados')
  paginado(@Query() paginacionDto: PaginacionDto) {
    return this.empleadosService.paginarEmpleados(paginacionDto);
  }

  @Get('departamento')
  @ApiGetDoc(EmpleadoResponseDto, 'empleados')
  buscarPorDepartamento(
    @Query('departamentoId', PublicIdPipe) departamentoId: string,
  ) {
    return this.empleadosService.buscarEmpleadosPorDepartamento(departamentoId);
  }

  @Get(':publicId')
  @ApiGetDetailDoc(EmpleadoResponseDto, 'empleado')
  buscarPorId(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.empleadosService.buscarEmpleadoPorId(publicId);
  }

  @Put(':publicId')
  @ApiUpdateDoc('empleado')
  @UseInterceptors(FileInterceptor('archivo', createMulterOptions('empleados')))
  @ApiOperation({ summary: 'Actualizar un empleado con foto opcional' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'codigo',
        'nombre',
        'apellidoPaterno',
        'departamentoId',
        'puestoId',
        'fechaIngreso',
      ],
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Foto opcional del empleado',
        },
        codigo: { type: 'string', example: 'EMP-002' },
        rfc: { type: 'string', example: 'ABCD010202EFG' },
        curp: { type: 'string', example: 'ABCD010202EFGH01JK' },
        nss: { type: 'string', example: '1345785269' },
        nombre: { type: 'string', example: 'John' },
        apellidoPaterno: { type: 'string', example: 'Lenon' },
        apellidoMaterno: { type: 'string', example: 'Winfrey' },
        genero: { type: 'string', example: 'F' },
        fechaNacimiento: { type: 'string', format: 'date' },
        departamentoId: {
          type: 'string',
          format: 'uuid',
          example: '01a0b13f-fe3f-7797-bb8e-1265f4409c78',
        },
        puestoId: {
          type: 'string',
          format: 'uuid',
          example: '01a0b13f-fe44-7df7-bc75-39b1185a7061',
        },
        turnoId: {
          type: 'string',
          format: 'uuid',
          example: '01a0caf8-9ca9-7ae1-9b29-9ab88730a738',
        },
        fechaIngreso: { type: 'string', format: 'date', example: '2000-01-01' },
        telefono: { type: 'string', example: '123456789012' },
        correo: { type: 'string', example: 'jhon@ticsa.mx' },
        direccion: { type: 'string', example: 'Calle Falsa 321' },
        usuarioId: {
          type: 'string',
          format: 'uuid',
          example: '01a0caf8-9ca9-7ae1-9b29-9ab88730a738',
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
      UpdateEmpleadoDto,
      this.normalizarBody(req.body as Record<string, unknown>),
    );
    if (archivo)
      dto.foto = this.uploadsService.guardarImagen(archivo, 'empleados');
    await this.validarDto(dto);
    return this.empleadosService.actualizarEmpleado(publicId, dto);
  }

  @Patch('activo/:publicId')
  @ApiUpdateDoc('empleado')
  actualizarActivo(@Param('publicId', PublicIdPipe) publicId: string) {
    return this.empleadosService.activarDesactivarEmpleado(publicId);
  }

  private normalizarBody(body: Record<string, unknown>) {
    if (!body) return {};

    const bodyNormalizado: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (key === 'archivo') continue;

      if (value === '') {
        bodyNormalizado[key] = undefined;
        continue;
      }

      if (key === 'salario' || key === 'salarioContrato') {
        bodyNormalizado[key] = Number(value);
        continue;
      }

      bodyNormalizado[key] = value;
    }

    return bodyNormalizado;
  }

  private async validarDto(dto: CreateEmpleadoDto | UpdateEmpleadoDto) {
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) throw new BadRequestException(errors);
  }
}
