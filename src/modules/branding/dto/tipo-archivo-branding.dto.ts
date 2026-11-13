import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const TIPOS_ARCHIVO_BRANDING = [
  'logo',
  'login-logo',
  'favicon',
] as const;

export type TipoArchivoBranding = (typeof TIPOS_ARCHIVO_BRANDING)[number];

export class TipoArchivoBrandingDto {
  @ApiProperty({
    enum: TIPOS_ARCHIVO_BRANDING,
    example: 'logo',
    description: 'Campo de branding que se actualizará con el archivo',
  })
  @IsIn(TIPOS_ARCHIVO_BRANDING, {
    message: `tipo debe ser uno de: ${TIPOS_ARCHIVO_BRANDING.join(', ')}`,
  })
  tipo: TipoArchivoBranding;
}
