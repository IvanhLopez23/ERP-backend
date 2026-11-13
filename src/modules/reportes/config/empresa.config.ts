export interface EmpresaReporte {
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
  sitio: string;
  logo: string;
}

/**
 * Lee las variables en el momento de la llamada (no al importar el módulo),
 * porque `ConfigModule` carga el `.env` después de evaluar los imports.
 */
export function obtenerEmpresaReporte(): EmpresaReporte {
  return {
    nombre: process.env.COMPANY_NAME ?? 'Nombre de la Empresa S.A. de C.V.',
    correo: process.env.COMPANY_EMAIL ?? process.env.EMAIL_FROM ?? '',
    telefono: process.env.COMPANY_PHONE ?? '',
    direccion: process.env.COMPANY_ADDRESS ?? '',
    sitio: process.env.COMPANY_WEBSITE ?? '',
    logo: process.env.COMPANY_LOGO ?? '',
  };
}
