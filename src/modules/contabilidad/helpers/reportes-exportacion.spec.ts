import {
  generarExcelReporte,
  generarPdfReporte,
  ReporteExportacion,
} from './reportes-exportacion';

describe('reportes-exportacion', () => {
  const modelo: ReporteExportacion = {
    titulo: 'Balanza de comprobación',
    subtitulo: 'Del 2026-11-01 al 2026-11-30',
    nombreArchivo: 'balanza-20261110',
    columnas: [
      { encabezado: 'Código', clave: 'codigo', ancho: 12 },
      { encabezado: 'Cuenta', clave: 'nombre', ancho: 30 },
      {
        encabezado: 'Saldo',
        clave: 'saldo',
        ancho: 14,
        formatoMoneda: true,
      },
    ],
    filas: [
      { codigo: '1101', nombre: 'Caja', saldo: 1000 },
      { codigo: '1102', nombre: 'Bancos', saldo: 2500.5 },
    ],
    resumen: [{ etiqueta: 'Total', valor: 3500.5 }],
  };

  it('genera un archivo Excel válido', async () => {
    const buffer = await generarExcelReporte(modelo);

    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 2).toString()).toBe('PK');
  });

  it('genera un archivo PDF válido', async () => {
    const buffer = await generarPdfReporte(modelo);

    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
