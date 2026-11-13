import {
  existsSync,
  mkdirSync,
  writeFileSync,
  unlink,
  rename,
  readFileSync,
} from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

const ubicacionArchivos = '../../../../imagenes';
const TEMPORAL = 'temporal';

export const guardarArchivo = (
  carpeta,
  archivo,
  extension,
  identificador = '',
) => {
  const nombreArchivo = identificador + randomUUID() + extension.toLowerCase();
  const ruta = join(__dirname, ubicacionArchivos, carpeta);
  const rutaArchivo = join(ruta, nombreArchivo);

  //Crea carpeta para almacenar los archivos en caso de que se requiera
  if (!existsSync(ruta)) {
    mkdirSync(ruta, { recursive: true });
  }

  //Guardar archivos nuevos
  if (archivo) {
    const buff = Buffer.from(archivo, 'base64');
    writeFileSync(rutaArchivo, buff);
  }

  //Retorna el nombre del archivo
  return nombreArchivo;
};

export const guardarArchivoMulter = (carpeta, archivo, identificador = '') => {
  const extension = extname(archivo.originalname).toLowerCase();
  const nombreArchivo = `${identificador}${randomUUID()}${extension}`;
  const ruta = join(__dirname, ubicacionArchivos, carpeta);

  // Crea carpeta para almacenar los archivos en caso de que se requiera
  if (!existsSync(ruta)) {
    mkdirSync(ruta, { recursive: true });
  }

  // Guardar buffer directamente, sin pasar por base64
  writeFileSync(join(ruta, nombreArchivo), archivo.buffer);

  // Retorna el nombre del archivo
  return nombreArchivo;
};

export const eliminarArchivo = (carpeta, archivo) => {
  if (archivo) {
    const ruta = join(__dirname, ubicacionArchivos, carpeta, archivo);

    // Eliminar archivo
    if (existsSync(ruta)) {
      unlink(ruta, function (err) {
        if (err) throw err;
      });
    }
  }
};

export const obtenerRutaArchivo = (carpeta, archivo) => {
  const ruta = join(__dirname, ubicacionArchivos, carpeta, archivo);
  console.log(ruta);

  // Retorna la ruta del archivo
  if (existsSync(ruta)) return ruta;

  return null;
};

export const obtenerExtension = (archivo) => {
  return extname(archivo);
};

export const moverArchivo = (
  carpetaOrigen,
  carpetaDestino,
  archivo,
  identificador = '',
) => {
  const nombreArchivo = identificador + archivo;
  const origen = join(__dirname, ubicacionArchivos, carpetaOrigen, archivo);
  const destino = join(__dirname, ubicacionArchivos, carpetaDestino);
  const destinoArchivo = join(destino, nombreArchivo);

  // Crea carpeta para almacenar las fotos en caso de que se requiera
  if (!existsSync(destino)) {
    mkdirSync(destino, { recursive: true });
  }

  // Guardar foto nueva
  rename(origen, destinoArchivo, (err) => {
    if (err) throw err;
  });

  return nombreArchivo;
};

export const moverArchivoMulter = (
  carpetaDestino,
  archivo,
  identificador = '',
) => {
  const nombreArchivo = identificador + archivo;
  const origen = join(__dirname, ubicacionArchivos, TEMPORAL, archivo);
  const destino = join(__dirname, ubicacionArchivos, carpetaDestino);
  const destinoArchivo = join(destino, nombreArchivo);

  // Crea carpeta para almacenar las fotos en caso de que se requiera
  if (!existsSync(destino)) {
    mkdirSync(destino, { recursive: true });
  }

  // Guardar foto nueva
  rename(origen, destinoArchivo, (err) => {
    if (err) throw err;
  });

  return nombreArchivo;
};

export const getBase64 = (carpeta: string, archivo: string): string | null => {
  let base64: string | null = null;

  const rutaArchivo = obtenerRutaArchivo(carpeta, archivo);

  if (rutaArchivo) {
    base64 = readFileSync(rutaArchivo, { encoding: 'base64' });
  }

  return base64;
};
