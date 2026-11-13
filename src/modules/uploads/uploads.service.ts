import { Injectable, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { unlinkSync, existsSync } from 'fs';

@Injectable()
export class UploadsService {
  guardarImagen(file: Express.Multer.File, subcarpeta: string): string {
    const url = `/uploads/${subcarpeta}/${file.filename}`;
    return url;
  }

  eliminarImagen(url: string): void {
    if (!url) return;

    const filePath = join(process.cwd(), url);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}
