import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { imageFileFilter } from '../helpers/file-filter.helper';

type MulterFileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => void;

export function createMulterOptions(
  subcarpeta: string,
  fileFilter: MulterFileFilter = imageFileFilter,
  maxSize = 2 * 1024 * 1024,
) {
  return {
    storage: diskStorage({
      destination: (_req: any, _file: any, cb: any) => {
        const uploadPath = join(process.cwd(), 'uploads', subcarpeta);
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (_req: any, file: any, cb: any) => {
        const ext = extname(file.originalname);
        cb(null, `${randomUUID()}${ext}`);
      },
    }),
    fileFilter,
    limits: { fileSize: maxSize },
  };
}

export const multerOptions = {
  storage: diskStorage({
    destination: (req: any, _file: any, cb: any) => {
      const subcarpeta = req.params?.subcarpeta || 'general';
      const uploadPath = join(process.cwd(), 'uploads', subcarpeta);
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (_req: any, file: any, cb: any) => {
      const ext = extname(file.originalname);
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
};
