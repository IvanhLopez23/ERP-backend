import { BadRequestException } from '@nestjs/common';

export type FormatoEstadoCuenta = 'csv' | 'ofx';

export interface MovimientoImportado {
  fecha: string;
  descripcion: string;
  referencia: string | null;
  cargo: number;
  abono: number;
  saldo: number | null;
}

export interface ErrorImportacion {
  fila: number;
  mensaje: string;
}

export interface ResultadoParseo {
  movimientos: MovimientoImportado[];
  errores: ErrorImportacion[];
}

const ALIAS_FECHA = ['fecha', 'date', 'fecha_operacion', 'fecha_valor'];
const ALIAS_DESCRIPCION = [
  'descripcion',
  'concepto',
  'detalle',
  'descripcion_operacion',
  'name',
];
const ALIAS_REFERENCIA = [
  'referencia',
  'ref',
  'fitid',
  'folio',
  'numero_referencia',
];
const ALIAS_CARGO = ['cargo', 'entrada', 'deposito', 'credito', 'depositos'];
const ALIAS_ABONO = ['abono', 'salida', 'retiro', 'debito', 'retiros'];
const ALIAS_MONTO = ['monto', 'importe', 'amount'];
const ALIAS_SALDO = ['saldo', 'balance'];

export function detectarFormato(
  nombreArchivo: string | undefined,
  contenido: string,
): FormatoEstadoCuenta {
  if (nombreArchivo && /\.ofx$/i.test(nombreArchivo)) return 'ofx';
  if (/^\s*(OFXHEADER|<OFX)/i.test(contenido)) return 'ofx';
  if (/<STMTTRN>/i.test(contenido)) return 'ofx';
  return 'csv';
}

export function parsearEstadoCuenta(
  buffer: Buffer,
  formato: FormatoEstadoCuenta,
): ResultadoParseo {
  const texto = buffer.toString('utf8').replace(/^\uFEFF/, '');
  if (!texto.trim()) {
    throw new BadRequestException('El archivo está vacío');
  }
  return formato === 'ofx' ? parsearOfx(texto) : parsearCsv(texto);
}

export function parsearCsv(texto: string): ResultadoParseo {
  const lineas = texto
    .split(/\r?\n/)
    .map((linea) => linea.trimEnd())
    .filter((linea) => linea.trim().length > 0);

  if (lineas.length < 2) {
    throw new BadRequestException(
      'El CSV debe incluir encabezados y al menos una fila',
    );
  }

  const delimitador = detectarDelimitador(lineas[0]);
  const encabezados = parsearLinea(lineas[0], delimitador).map(normalizar);
  const indices = {
    fecha: buscarIndice(encabezados, ALIAS_FECHA),
    descripcion: buscarIndice(encabezados, ALIAS_DESCRIPCION),
    referencia: buscarIndice(encabezados, ALIAS_REFERENCIA),
    cargo: buscarIndice(encabezados, ALIAS_CARGO),
    abono: buscarIndice(encabezados, ALIAS_ABONO),
    monto: buscarIndice(encabezados, ALIAS_MONTO),
    saldo: buscarIndice(encabezados, ALIAS_SALDO),
  };

  if (indices.fecha < 0) {
    throw new BadRequestException(
      'El CSV debe incluir una columna de fecha (fecha, date, fecha_operacion)',
    );
  }
  if (indices.descripcion < 0) {
    throw new BadRequestException(
      'El CSV debe incluir una columna de descripción (descripcion, concepto, detalle)',
    );
  }
  if (indices.cargo < 0 && indices.abono < 0 && indices.monto < 0) {
    throw new BadRequestException(
      'El CSV debe incluir cargo/abono o una columna monto/importe',
    );
  }

  const movimientos: MovimientoImportado[] = [];
  const errores: ErrorImportacion[] = [];

  for (let i = 1; i < lineas.length; i += 1) {
    const fila = i + 1;
    const campos = parsearLinea(lineas[i], delimitador);
    const valor = (indice: number) =>
      indice >= 0 ? (campos[indice] ?? '').trim() : '';

    const fecha = parsearFecha(valor(indices.fecha));
    if (!fecha) {
      errores.push({
        fila,
        mensaje: `Fecha inválida: "${valor(indices.fecha)}"`,
      });
      continue;
    }

    const descripcion = valor(indices.descripcion) || 'Movimiento importado';
    const referencia = valor(indices.referencia) || null;
    const saldoTexto = valor(indices.saldo);
    const saldo = saldoTexto ? parsearMonto(saldoTexto) : null;

    let cargo = 0;
    let abono = 0;
    if (indices.cargo >= 0 || indices.abono >= 0) {
      cargo =
        indices.cargo >= 0 ? (parsearMonto(valor(indices.cargo)) ?? 0) : 0;
      abono =
        indices.abono >= 0 ? (parsearMonto(valor(indices.abono)) ?? 0) : 0;
    } else {
      const monto = parsearMonto(valor(indices.monto));
      if (monto === null) {
        errores.push({ fila, mensaje: 'Monto inválido' });
        continue;
      }
      if (monto < 0) abono = Math.abs(monto);
      else cargo = monto;
    }

    const error = validarMonto(cargo, abono);
    if (error) {
      errores.push({ fila, mensaje: error });
      continue;
    }

    movimientos.push({
      fecha,
      descripcion,
      referencia,
      cargo: redondear2(cargo),
      abono: redondear2(abono),
      saldo: saldo === null ? null : redondear2(saldo),
    });
  }

  return { movimientos, errores };
}

export function parsearOfx(texto: string): ResultadoParseo {
  const bloques = [...texto.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)].map(
    (match) => match[1],
  );

  if (!bloques.length) {
    throw new BadRequestException(
      'No se encontraron transacciones <STMTTRN> en el archivo OFX',
    );
  }

  const movimientos: MovimientoImportado[] = [];
  const errores: ErrorImportacion[] = [];

  bloques.forEach((bloque, indice) => {
    const fila = indice + 1;
    const fechaTexto = extraerTag(bloque, 'DTPOSTED');
    const fecha = parsearFechaOfx(fechaTexto);
    if (!fecha) {
      errores.push({
        fila,
        mensaje: `Fecha OFX inválida: "${fechaTexto ?? ''}"`,
      });
      return;
    }

    const montoTexto = extraerTag(bloque, 'TRNAMT');
    const monto = montoTexto ? parsearMonto(montoTexto) : null;
    if (monto === null) {
      errores.push({ fila, mensaje: 'TRNAMT inválido' });
      return;
    }

    const nombre = extraerTag(bloque, 'NAME');
    const memo = extraerTag(bloque, 'MEMO');
    const descripcion =
      [nombre, memo].filter(Boolean).join(' - ') || 'Movimiento importado';
    const referencia =
      extraerTag(bloque, 'FITID') ??
      extraerTag(bloque, 'CHECKNUM') ??
      extraerTag(bloque, 'REFNUM');

    movimientos.push({
      fecha,
      descripcion,
      referencia,
      cargo: monto > 0 ? redondear2(monto) : 0,
      abono: monto < 0 ? redondear2(Math.abs(monto)) : 0,
      saldo: null,
    });
  });

  return { movimientos, errores };
}

function detectarDelimitador(linea: string) {
  const candidatos = [',', ';', '\t'];
  let mejor = ',';
  let maximo = -1;
  for (const candidato of candidatos) {
    const total = (linea.match(new RegExp(candidato, 'g')) ?? []).length;
    if (total > maximo) {
      maximo = total;
      mejor = candidato;
    }
  }
  return mejor;
}

function parsearLinea(linea: string, delimitador: string): string[] {
  const campos: string[] = [];
  let actual = '';
  let entreComillas = false;

  for (let i = 0; i < linea.length; i += 1) {
    const caracter = linea[i];
    if (caracter === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i += 1;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (caracter === delimitador && !entreComillas) {
      campos.push(actual);
      actual = '';
    } else {
      actual += caracter;
    }
  }
  campos.push(actual);
  return campos.map((campo) => campo.trim());
}

function normalizar(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
}

function buscarIndice(encabezados: string[], alias: string[]) {
  return encabezados.findIndex((encabezado) => alias.includes(encabezado));
}

export function parsearFecha(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const limpio = valor.trim().slice(0, 10);
  let anio: number;
  let mes: number;
  let dia: number;

  const iso = limpio.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  const latino = limpio.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);

  if (iso) {
    anio = Number(iso[1]);
    mes = Number(iso[2]);
    dia = Number(iso[3]);
  } else if (latino) {
    dia = Number(latino[1]);
    mes = Number(latino[2]);
    anio = Number(latino[3]);
    if (anio < 100) anio += 2000;
  } else {
    return null;
  }

  if (
    !Number.isInteger(anio) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(dia) ||
    mes < 1 ||
    mes > 12 ||
    dia < 1 ||
    dia > 31
  ) {
    return null;
  }

  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function parsearFechaOfx(valor: string | null): string | null {
  if (!valor) return null;
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length < 8) return null;
  return parsearFecha(
    `${digitos.slice(0, 4)}-${digitos.slice(4, 6)}-${digitos.slice(6, 8)}`,
  );
}

export function parsearMonto(valor: string | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  let texto = valor.trim();
  if (!texto) return null;

  let negativo = false;
  if (/^\(.*\)$/.test(texto)) {
    negativo = true;
    texto = texto.slice(1, -1);
  }

  texto = texto.replace(/[^0-9,.-]/g, '');
  if (!texto || texto === '-' || texto === '.' || texto === ',') return null;

  const ultimaComa = texto.lastIndexOf(',');
  const ultimoPunto = texto.lastIndexOf('.');

  if (ultimaComa >= 0 && ultimoPunto >= 0) {
    if (ultimaComa > ultimoPunto) {
      texto = texto.replace(/\./g, '').replace(',', '.');
    } else {
      texto = texto.replace(/,/g, '');
    }
  } else if (ultimaComa >= 0) {
    const decimales = texto.length - ultimaComa - 1;
    if (decimales > 0 && decimales <= 2) {
      texto = texto.replace(',', '.');
    } else {
      texto = texto.replace(/,/g, '');
    }
  }

  const numero = Number(texto);
  if (Number.isNaN(numero)) return null;
  return negativo ? -numero : numero;
}

function validarMonto(cargo: number, abono: number) {
  if (cargo < 0 || abono < 0) {
    return 'El cargo y el abono no pueden ser negativos';
  }
  if (cargo > 0 && abono > 0) {
    return 'La fila tiene cargo y abono a la vez';
  }
  if (cargo === 0 && abono === 0) {
    return 'La fila no tiene monto';
  }
  return null;
}

function extraerTag(bloque: string, tag: string): string | null {
  const coincidencia = bloque.match(
    new RegExp(`<${tag}>\\s*([^<\\r\\n]*)`, 'i'),
  );
  const valor = coincidencia?.[1]?.trim();
  return valor ? valor : null;
}

function redondear2(valor: number) {
  return Math.round(valor * 100) / 100;
}
