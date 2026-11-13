import { existsSync, readFileSync } from 'fs';
import { extname, join } from 'path';

/**
 * pdfkit solo soporta JPEG y PNG. WebP (permitido en uploads)
 * no es soportado: se devuelve null y el llamador usa un fallback.
 */
function esImagenSoportada(rutaAbsoluta: string): boolean {
  const extension = extname(rutaAbsoluta).toLowerCase();
  if (extension === '.webp') return false;
  try {
    const encabezado = readFileSync(rutaAbsoluta).subarray(0, 12);
    if (
      encabezado.subarray(0, 4).toString() === 'RIFF' &&
      encabezado.subarray(8, 12).toString() === 'WEBP'
    ) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}

export function leerImagenBuffer(rutaAbsoluta: string): Buffer | null {
  if (!rutaAbsoluta || !existsSync(rutaAbsoluta)) return null;
  try {
    if (!esImagenSoportada(rutaAbsoluta)) return null;
    return readFileSync(rutaAbsoluta);
  } catch {
    return null;
  }
}

/**
 * Convierte la URL pública de un upload (`/uploads/empleados/xxx.jpg`)
 * a un Buffer listo para pdfkit. Null si falta o no es soportado.
 */
export function uploadUrlABuffer(
  url: string | null | undefined,
): Buffer | null {
  if (!url) return null;
  const relativa = url.startsWith('/uploads/')
    ? url.slice('/uploads/'.length)
    : url.replace(/^\/+/, '');
  return leerImagenBuffer(join(process.cwd(), 'uploads', relativa));
}

function dataUriABuffer(dataUri: string): Buffer | null {
  const coincidencia = /^data:(image\/(?:jpeg|png|gif));base64,(.+)$/i.exec(
    dataUri.trim(),
  );
  if (!coincidencia) return null;
  try {
    return Buffer.from(coincidencia[2], 'base64');
  } catch {
    return null;
  }
}

async function descargarImagenBuffer(url: string): Promise<Buffer | null> {
  try {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 8000);
    const respuesta = await fetch(url, { signal: controlador.signal });
    clearTimeout(temporizador);
    if (!respuesta.ok) return null;
    const tipo = (respuesta.headers.get('content-type') ?? '').toLowerCase();
    if (
      !tipo.includes('jpeg') &&
      !tipo.includes('jpg') &&
      !tipo.includes('png')
    )
      return null;
    return Buffer.from(await respuesta.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Resuelve el logo de la empresa a un Buffer para pdfkit:
 * - URL pública (`http(s)`): se descarga (con timeout).
 * - `data:`: se decodifica.
 * - ruta local (absoluta o relativa al proyecto): se lee del disco.
 * Null si está vacío, no existe o no es JPEG/PNG.
 */
export async function resolverLogoBuffer(
  logo: string | null | undefined,
): Promise<Buffer | null> {
  if (!logo) return null;
  const texto = logo.trim();
  if (!texto) return null;
  if (/^data:/i.test(texto)) return dataUriABuffer(texto);
  if (/^https?:/i.test(texto)) return descargarImagenBuffer(texto);
  const ruta = texto.startsWith('/') ? texto : join(process.cwd(), texto);
  return leerImagenBuffer(ruta);
}
