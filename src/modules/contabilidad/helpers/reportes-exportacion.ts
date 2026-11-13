import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface ColumnaReporte {
  encabezado: string;
  clave: string;
  ancho?: number;
  alineacion?: 'left' | 'right';
  formatoMoneda?: boolean;
}

export type ValorReporte = string | number | null | undefined;

export interface FilaReporte {
  [clave: string]: ValorReporte;
}

export interface ReporteExportacion {
  titulo: string;
  subtitulo: string;
  columnas: ColumnaReporte[];
  filas: FilaReporte[];
  resumen?: Array<{ etiqueta: string; valor: ValorReporte }>;
  nombreArchivo: string;
}

const COLOR_PRIMARIO = 'FF1E3A8A';
const COLOR_PRIMARIO_PDF = '#1e3a8a';
const COLOR_TEXTO_PDF = '#1f2937';
const COLOR_TENUE_PDF = '#4b5563';
const COLOR_BORDE_PDF = '#e2e8f0';

export function formatearMoneda(valor: unknown): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(valor ?? 0));
}

export async function generarExcelReporte(
  modelo: ReporteExportacion,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ERP';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet('Reporte', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });
  const totalColumnas = modelo.columnas.length;

  hoja.columns = modelo.columnas.map((columna) => ({
    width: columna.ancho ?? 18,
  }));

  hoja.mergeCells(1, 1, 1, totalColumnas);
  const titulo = hoja.getCell(1, 1);
  titulo.value = modelo.titulo;
  titulo.font = { bold: true, size: 14, color: { argb: COLOR_PRIMARIO } };
  titulo.alignment = { horizontal: 'center' };
  hoja.getRow(1).height = 22;

  hoja.mergeCells(2, 1, 2, totalColumnas);
  const subtitulo = hoja.getCell(2, 1);
  subtitulo.value = modelo.subtitulo;
  subtitulo.font = { size: 10, color: { argb: 'FF4B5563' } };
  subtitulo.alignment = { horizontal: 'center' };

  const encabezado = hoja.getRow(4);
  modelo.columnas.forEach((columna, indice) => {
    const celda = encabezado.getCell(indice + 1);
    celda.value = columna.encabezado;
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_PRIMARIO },
    };
    celda.alignment = {
      horizontal:
        columna.alineacion ?? (columna.formatoMoneda ? 'right' : 'left'),
      vertical: 'middle',
    };
    celda.border = {
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  });
  encabezado.height = 18;

  for (const fila of modelo.filas) {
    const filaExcel = hoja.addRow(
      modelo.columnas.map((columna) => fila[columna.clave] ?? ''),
    );
    modelo.columnas.forEach((columna, indice) => {
      const celda = filaExcel.getCell(indice + 1);
      if (columna.formatoMoneda) celda.numFmt = '#,##0.00';
      celda.alignment = {
        horizontal:
          columna.alineacion ?? (columna.formatoMoneda ? 'right' : 'left'),
      };
    });
  }

  if (modelo.resumen?.length) {
    hoja.addRow([]);
    for (const item of modelo.resumen) {
      const fila = hoja.addRow([]);
      const etiqueta = fila.getCell(1);
      etiqueta.value = item.etiqueta;
      etiqueta.font = { bold: true };

      const valor = fila.getCell(totalColumnas);
      valor.value = item.valor ?? '';
      if (typeof item.valor === 'number') valor.numFmt = '#,##0.00';
      valor.alignment = { horizontal: 'right' };
      valor.font = { bold: true, color: { argb: COLOR_PRIMARIO } };
    }
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function generarPdfReporte(modelo: ReporteExportacion): Promise<Buffer> {
  return new Promise((resolver, rechazar) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      bufferPages: true,
      margins: { top: 36, bottom: 36, left: 36, right: 36 },
      info: { Title: modelo.titulo, Author: 'ERP' },
    });
    const partes: Buffer[] = [];
    doc.on('data', (parte: Buffer) =>
      partes.push(Buffer.isBuffer(parte) ? parte : Buffer.from(parte)),
    );
    doc.on('end', () => resolver(Buffer.concat(partes)));
    doc.on('error', rechazar);

    const margenIzquierdo = doc.page.margins.left;
    const anchoPagina =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const limiteInferior = () => doc.page.height - doc.page.margins.bottom;

    const pesos = modelo.columnas.map((columna) => columna.ancho ?? 18);
    const totalPeso = pesos.reduce((total, peso) => total + peso, 0);
    const anchos = pesos.map((peso) => (peso / totalPeso) * anchoPagina);

    const dibujarEncabezadoTabla = (y: number) => {
      let x = margenIzquierdo;
      doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_PRIMARIO_PDF);
      modelo.columnas.forEach((columna, indice) => {
        doc.text(columna.encabezado, x + 2, y + 3, {
          width: anchos[indice] - 4,
          height: 14,
          ellipsis: true,
          align:
            columna.alineacion ?? (columna.formatoMoneda ? 'right' : 'left'),
        });
        x += anchos[indice];
      });
      doc
        .moveTo(margenIzquierdo, y + 18)
        .lineTo(margenIzquierdo + anchoPagina, y + 18)
        .strokeColor(COLOR_PRIMARIO_PDF)
        .lineWidth(1)
        .stroke();
      return y + 20;
    };

    doc
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor(COLOR_PRIMARIO_PDF)
      .text(modelo.titulo, { align: 'center' });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLOR_TENUE_PDF)
      .text(modelo.subtitulo, { align: 'center' });
    doc.moveDown(0.6);

    let y = dibujarEncabezadoTabla(doc.y);
    const alturaFila = 16;

    for (const fila of modelo.filas) {
      if (y + alturaFila > limiteInferior()) {
        doc.addPage();
        y = dibujarEncabezadoTabla(doc.page.margins.top);
      }

      let x = margenIzquierdo;
      modelo.columnas.forEach((columna, indice) => {
        const valor = fila[columna.clave];
        const texto = columna.formatoMoneda
          ? formatearMoneda(valor)
          : valor === null || valor === undefined
            ? ''
            : String(valor);
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(COLOR_TEXTO_PDF)
          .text(texto, x + 2, y + 3, {
            width: anchos[indice] - 4,
            height: alturaFila - 4,
            ellipsis: true,
            align:
              columna.alineacion ?? (columna.formatoMoneda ? 'right' : 'left'),
          });
        x += anchos[indice];
      });

      doc
        .moveTo(margenIzquierdo, y + alturaFila)
        .lineTo(margenIzquierdo + anchoPagina, y + alturaFila)
        .strokeColor(COLOR_BORDE_PDF)
        .lineWidth(0.5)
        .stroke();
      y += alturaFila;
    }

    if (modelo.resumen?.length) {
      if (y + 20 > limiteInferior()) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      y += 6;
      for (const item of modelo.resumen) {
        if (y + alturaFila > limiteInferior()) {
          doc.addPage();
          y = doc.page.margins.top;
        }
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(COLOR_TEXTO_PDF)
          .text(item.etiqueta, margenIzquierdo, y, {
            width: anchoPagina - 120,
            align: 'right',
          });
        const texto =
          typeof item.valor === 'number'
            ? formatearMoneda(item.valor)
            : String(item.valor ?? '');
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(COLOR_PRIMARIO_PDF)
          .text(texto, margenIzquierdo + anchoPagina - 120, y, {
            width: 120,
            align: 'right',
          });
        y += alturaFila;
      }
    }

    doc.end();
  });
}
