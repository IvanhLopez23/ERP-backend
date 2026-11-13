import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { STATUS_CODES } from 'http';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ApiBearerAuthDoc, ApiErrorResponses } from '../../common/decorators';
import { GetResponseDto } from '../../common/dtos/get-response.dto';
import { UpdateResponseDto } from '../../common/dtos/update-response.dto';
import { createMulterOptions } from '../uploads/config/multer.config';
import { brandingFileFilter } from '../uploads/helpers/file-filter.helper';
import { BrandingService } from './branding.service';
import { BrandingResponseDto } from './dto/branding.response.dto';
import { TipoArchivoBrandingDto } from './dto/tipo-archivo-branding.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';

@ApiTags('Branding')
@Controller('branding')
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener la configuración de apariencia (público)',
  })
  @ApiExtraModels(GetResponseDto, BrandingResponseDto)
  @ApiOkResponse({
    description: STATUS_CODES[200],
    schema: {
      allOf: [
        { $ref: getSchemaPath(GetResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(BrandingResponseDto) },
          },
        },
      ],
    },
  })
  @ApiErrorResponses(400, 500)
  async obtener() {
    const data = await this.brandingService.obtener();
    return { data };
  }

  @Put()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('/configuraciones/apariencia')
  @ApiBearerAuthDoc()
  @ApiOperation({ summary: 'Actualizar la configuración de apariencia' })
  @ApiOkResponse({
    description: STATUS_CODES[200],
    type: UpdateResponseDto,
  })
  @ApiErrorResponses(400, 401, 403, 404, 500)
  actualizar(@Body() dto: UpdateBrandingDto) {
    return this.brandingService.actualizar(dto);
  }

  @Post('archivo')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermission('/configuraciones/apariencia')
  @UseInterceptors(
    FileInterceptor(
      'archivo',
      createMulterOptions('branding', brandingFileFilter),
    ),
  )
  @ApiBearerAuthDoc()
  @ApiOperation({
    summary: 'Subir logo, logo de login o favicon de la apariencia',
  })
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
            'Archivo (PNG, JPEG, WebP, SVG o ICO, máx 2MB). El tipo se indica en el query ?tipo=logo|login-logo|favicon',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: STATUS_CODES[201],
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Archivo de branding subido exitosamente',
        },
        data: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              example: '/uploads/branding/logo.png',
            },
          },
        },
      },
    },
  })
  @ApiErrorResponses(400, 401, 403, 500)
  subirArchivo(
    @Query() query: TipoArchivoBrandingDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.brandingService.subirArchivo(query.tipo, archivo);
  }
}
