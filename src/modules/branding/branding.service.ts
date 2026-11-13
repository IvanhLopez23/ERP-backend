import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadsService } from '../uploads/uploads.service';
import { Branding, BrandingColors } from './entities/branding.entity';
import { BrandingResponseDto } from './dto/branding.response.dto';
import {
  TipoArchivoBranding,
  TIPOS_ARCHIVO_BRANDING,
} from './dto/tipo-archivo-branding.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';

const COLORES_DEFAULT: BrandingColors = {
  headerBg: '#0f172a',
  headerText: '#f6f7f8',
  primary: '#1e3a5f',
  secondary: '#f1f5f9',
  tertiary: '#0ea5e9',
  quaternary: '#0f172a',
};

const CAMPO_POR_TIPO: Record<TipoArchivoBranding, keyof Branding> = {
  logo: 'logoUrl',
  'login-logo': 'loginLogoUrl',
  favicon: 'faviconUrl',
};

@Injectable()
export class BrandingService {
  constructor(
    @InjectRepository(Branding)
    private readonly brandingRepository: Repository<Branding>,
    private readonly uploadsService: UploadsService,
  ) {}

  private mapearRespuesta(branding: Branding): BrandingResponseDto {
    return {
      publicId: branding.publicId,
      appName: branding.appName,
      sidebarIcon: branding.sidebarIcon,
      logoUrl: branding.logoUrl,
      loginLogoUrl: branding.loginLogoUrl,
      faviconUrl: branding.faviconUrl,
      radio: branding.radio,
      fuente: branding.fuente,
      colors: branding.colors,
      updatedAt: branding.fechaActualizacion,
    };
  }

  private async obtenerOCrear(): Promise<Branding> {
    const existentes = await this.brandingRepository.find({
      order: { id: 'ASC' },
      take: 1,
    });
    let branding = existentes[0];
    if (!branding) {
      branding = await this.brandingRepository.save(
        this.brandingRepository.create({
          appName: 'AuraERP',
          sidebarIcon: 'i-heroicons-cube-transparent',
          logoUrl: null,
          loginLogoUrl: null,
          faviconUrl: '/favicon.ico',
          radio: 1.5,
          fuente: 'Public Sans',
          colors: COLORES_DEFAULT,
        }),
      );
    }
    return branding;
  }

  async obtener(): Promise<BrandingResponseDto> {
    try {
      const branding = await this.obtenerOCrear();
      return this.mapearRespuesta(branding);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async actualizar(dto: UpdateBrandingDto) {
    try {
      const branding = await this.obtenerOCrear();
      await this.brandingRepository.update(branding.id, {
        appName: dto.appName,
        sidebarIcon: dto.sidebarIcon,
        logoUrl: dto.logoUrl ?? null,
        loginLogoUrl: dto.loginLogoUrl ?? null,
        faviconUrl: dto.faviconUrl,
        ...(dto.radio !== undefined ? { radio: dto.radio } : {}),
        ...(dto.fuente !== undefined ? { fuente: dto.fuente } : {}),
        colors: dto.colors,
        fechaActualizacion: () => 'NOW()',
      });
      return { message: 'Branding actualizado exitosamente' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async subirArchivo(
    tipo: string,
    archivo?: Express.Multer.File,
  ): Promise<{ message: string; data: { url: string } }> {
    try {
      if (!TIPOS_ARCHIVO_BRANDING.includes(tipo as TipoArchivoBranding)) {
        throw new BadRequestException(
          `tipo debe ser uno de: ${TIPOS_ARCHIVO_BRANDING.join(', ')}`,
        );
      }
      if (!archivo) {
        throw new BadRequestException(
          'Debe adjuntar el archivo en el campo "archivo"',
        );
      }

      const campo = CAMPO_POR_TIPO[tipo as TipoArchivoBranding];
      const branding = await this.obtenerOCrear();
      const anterior = branding[campo] as string | null;
      const url = this.uploadsService.guardarImagen(archivo, 'branding');

      await this.brandingRepository.update(branding.id, {
        [campo]: url,
        fechaActualizacion: () => 'NOW()',
      });
      this.eliminarArchivoAnterior(anterior, url);

      return {
        message: 'Archivo de branding subido exitosamente',
        data: { url },
      };
    } catch (error) {
      // El UploadedFileCleanupInterceptor global borra el archivo si hubo error.
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      console.log(error);
      throw error;
    }
  }

  /**
   * Borra el archivo anterior solo si se reemplazó por uno nuevo gestionado
   * por /uploads. Nunca debe romper la respuesta; es mejor esfuerzo.
   */
  private eliminarArchivoAnterior(anterior?: string | null, nuevo?: string) {
    if (
      anterior &&
      anterior.startsWith('/uploads/') &&
      nuevo &&
      nuevo !== anterior
    ) {
      try {
        this.uploadsService.eliminarImagen(anterior);
      } catch {
        // Mejor esfuerzo.
      }
    }
  }
}
