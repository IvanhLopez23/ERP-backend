import { BadRequestException } from '@nestjs/common';

export const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    cb(
      new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan JPEG, PNG y WebP.`,
      ),
      false,
    );
    return;
  }
  cb(null, true);
};

const DOCUMENTO_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/**
 * Filtro para comprobantes: imágenes y PDF (por ejemplo, una carta firmada).
 * Incluye respaldo por extensión porque algunos navegadores reportan el PDF
 * con un mimetype distinto.
 */
export const documentoFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const extension = file.originalname
    .slice(file.originalname.lastIndexOf('.'))
    .toLowerCase();
  if (!DOCUMENTO_MIMES.includes(file.mimetype) && extension !== '.pdf') {
    cb(
      new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan PDF, JPEG, PNG y WebP.`,
      ),
      false,
    );
    return;
  }
  cb(null, true);
};

const BRANDING_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
];

const BRANDING_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico'];

/**
 * Filtro para los archivos de branding (logo, logo de login y favicon).
 * Acepta los tipos de imagen del filtro general más SVG e ICO.
 * Incluye respaldo por extensión porque algunos navegadores/servidores
 * reportan el .ico con mimetypes distintos.
 */
export const brandingFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const extension = file.originalname
    .slice(file.originalname.lastIndexOf('.'))
    .toLowerCase();
  if (
    !BRANDING_MIMES.includes(file.mimetype) &&
    !BRANDING_EXTENSIONS.includes(extension)
  ) {
    cb(
      new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan PNG, JPEG, WebP, SVG e ICO.`,
      ),
      false,
    );
    return;
  }
  cb(null, true);
};
