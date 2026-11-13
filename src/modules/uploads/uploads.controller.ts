import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
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
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { multerOptions } from './config/multer.config';
import { UploadsService } from './uploads.service';
import { ApiBearerAuthDoc, ApiErrorResponses } from '../../common/decorators';

@ApiTags('Uploads')
@ApiBearerAuthDoc()
@ApiErrorResponses(400, 401, 403, 404, 409, 500)
@UseGuards(AuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('subcarpeta')
  @UseInterceptors(FileInterceptor('archivo', multerOptions))
  @ApiOperation({ summary: 'Subir una imagen' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (JPEG, PNG o WebP, máx 2MB)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Imagen subida correctamente.' })
  @ApiResponse({
    status: 400,
    description: 'Tipo de archivo no válido o archivo muy grande.',
  })
  uploadFile(
    @Query('subcarpeta') subcarpeta: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = this.uploadsService.guardarImagen(file, subcarpeta);
    return { url };
  }
}
