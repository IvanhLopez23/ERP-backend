import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Empleado } from '../rh/entities/empleado.entity';
import { Departamento } from '../rh/entities/departamento.entity';
import { Puesto } from '../rh/entities/puesto.entity';
import { Turno } from '../rh/entities/turno.entity';
import { EmpleadosReporteQueryDto } from './dto';
import { obtenerEmpresaReporte } from './config/empresa.config';
import { resolverLogoBuffer, uploadUrlABuffer } from './helpers/imagenes';

type DocPdf = InstanceType<typeof PDFDocument>;

const COLORES = {
  primario: '#1e3a8a',
  secundario: '#3b82f6',
  texto: '#1f2937',
  tenue: '#4b5563',
  fondoClaro: '#f8fafc',
  borde: '#e2e8f0',
  badgeFondo: '#e0e7ff',
};

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const TIPO_CONTRATO: Record<string, string> = {
  indeterminado: 'Tiempo Indeterminado',
  temporal: 'Temporal',
  obra: 'Por Obra',
};

function aFecha(valor: Date | string | null | undefined): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  const [y, m, d] = valor.split('T')[0].split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function fechaLarga(valor: Date | string | null | undefined): string {
  const fecha = aFecha(valor);
  if (!fecha) return '—';
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

function fechaCorta(valor: Date | string | null | undefined): Date | null {
  return aFecha(valor);
}

function moneda(valor: unknown): string {
  const numero = Number(valor ?? 0);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(numero);
}

function antiguedadTexto(
  fechaIngreso: Date | string | null | undefined,
): string {
  const inicio = aFecha(fechaIngreso);
  if (!inicio) return '—';
  const hoy = new Date();
  let anios = hoy.getFullYear() - inicio.getFullYear();
  let meses = hoy.getMonth() - inicio.getMonth();
  if (hoy.getDate() < inicio.getDate()) meses--;
  if (meses < 0) {
    anios--;
    meses += 12;
  }
  if (anios <= 0 && meses <= 0) return 'Menos de un mes';
  const partes: string[] = [];
  if (anios > 0) partes.push(`${anios} año${anios === 1 ? '' : 's'}`);
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`);
  return partes.join(', ');
}

function nombreCompleto(
  nombre: string,
  paterno: string,
  materno?: string | null,
): string {
  return [nombre, paterno, materno].filter(Boolean).join(' ');
}

interface SegmentoFicha {
  texto: string;
  negrita?: boolean;
}

interface DatosFicha {
  empresa: {
    nombre: string;
    correo: string;
    telefono: string;
    direccion: string;
    sitio: string;
  };
  logo: Buffer | null;
  foto: Buffer | null;
  iniciales: string;
  empleado: {
    nombreCompleto: string;
    puesto: string;
    departamento: string;
    codigo: string;
    estatus: string;
    correo: string;
    telefono: string;
    fechaIngreso: string;
    antiguedad: string;
    ubicacion: string;
    tipoContrato: string;
    turno: string;
    reportaA: string;
    rfc: string;
    curp: string;
    nss: string;
    salario: string;
    fechaNacimiento: string;
  };
  tieneDatosFiscales: boolean;
  carta: SegmentoFicha[][];
  fechaActual: string;
}

interface EscalaFicha {
  foto: number;
  pad: number;
  nombre: number;
  puesto: number;
  badge: number;
  seccion: number;
  campo: number;
  carta: number;
  gap: number;
  parrafo: number;
}

function escalaFicha(factor: number): EscalaFicha {
  return {
    foto: Math.round(96 * factor),
    pad: Math.round(11 * factor),
    nombre: 19 * factor,
    puesto: 12 * factor,
    badge: 9 * factor,
    seccion: 11 * factor,
    campo: 8.5 * factor,
    carta: 10 * factor,
    gap: 8 * factor,
    parrafo: 8 * factor,
  };
}

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
    @InjectRepository(Departamento)
    private readonly deptoRepository: Repository<Departamento>,
    @InjectRepository(Puesto)
    private readonly puestoRepository: Repository<Puesto>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
  ) {}

  // ==================== Consulta base ====================

  async buscarEmpleadosReporte(
    query: EmpleadosReporteQueryDto,
  ): Promise<Empleado[]> {
    let departamentoIds: number[] | undefined;
    if (query.departamentoId?.length) {
      const departamentos = await this.deptoRepository.find({
        where: { publicId: In(query.departamentoId) },
      });
      const encontrados = new Set(departamentos.map((d) => d.publicId));
      const faltante = query.departamentoId.find((p) => !encontrados.has(p));
      if (faltante)
        throw new BadRequestException(`El departamento ${faltante} no existe`);
      departamentoIds = departamentos.map((d) => d.id);
    }

    let puestoId: number | undefined;
    if (query.puestoId) {
      const puesto = await this.puestoRepository.findOne({
        where: { publicId: query.puestoId },
      });
      if (!puesto)
        throw new BadRequestException(`El puesto ${query.puestoId} no existe`);
      puestoId = puesto.id;
    }

    let turnoId: number | undefined;
    if (query.turnoId) {
      const turno = await this.turnoRepository.findOne({
        where: { publicId: query.turnoId },
      });
      if (!turno)
        throw new BadRequestException(`El turno ${query.turnoId} no existe`);
      turnoId = turno.id;
    }

    const qb = this.empleadoRepository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.departamento', 'departamento')
      .leftJoinAndSelect('e.puesto', 'puesto')
      .leftJoinAndSelect('e.turno', 'turno')
      .leftJoinAndSelect('e.jefe', 'jefe')
      .leftJoinAndSelect('e.contratos', 'contratos');
    if (!query.incluirInactivos) {
      qb.andWhere('e.activo = :activo', { activo: true });
    }
    if (departamentoIds) {
      qb.andWhere('e.departamentoId IN (:...departamentoIds)', {
        departamentoIds,
      });
    }
    if (puestoId !== undefined) {
      qb.andWhere('e.puestoId = :puestoId', { puestoId });
    }
    if (turnoId !== undefined) {
      qb.andWhere('e.turnoId = :turnoId', { turnoId });
    }
    if (query.buscar) {
      const texto = `%${query.buscar}%`;
      qb.andWhere(
        '(e.nombre ILIKE :texto OR e.apellidoPaterno ILIKE :texto OR e.apellidoMaterno ILIKE :texto OR e.codigo ILIKE :texto)',
        { texto },
      );
    }
    qb.orderBy('e.nombre', 'ASC').addOrderBy('e.apellidoPaterno', 'ASC');
    return qb.getMany();
  }

  private contratoActivo(empleado: Empleado) {
    const activos = (empleado.contratos ?? []).filter((c) => c.activo);
    activos.sort(
      (a, b) =>
        new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime(),
    );
    return activos[0];
  }

  private tipoContratoTexto(empleado: Empleado): string {
    const contrato = this.contratoActivo(empleado);
    if (!contrato) return '—';
    return TIPO_CONTRATO[contrato.tipo] ?? contrato.tipo;
  }

  // ==================== Excel ====================

  async generarExcelEmpleados(query: EmpleadosReporteQueryDto): Promise<{
    buffer: Buffer;
    nombreArchivo: string;
  }> {
    const empleados = await this.buscarEmpleadosReporte(query);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ERP';
    workbook.created = new Date();
    const hoja = workbook.addWorksheet('Empleados');

    hoja.columns = [
      { header: 'Código', key: 'codigo', width: 14 },
      { header: 'Nombre', key: 'nombre', width: 18 },
      { header: 'Apellido paterno', key: 'apellidoPaterno', width: 20 },
      { header: 'Apellido materno', key: 'apellidoMaterno', width: 20 },
      { header: 'Departamento', key: 'departamento', width: 24 },
      { header: 'Puesto', key: 'puesto', width: 26 },
      { header: 'Turno', key: 'turno', width: 18 },
      { header: 'Reporta a', key: 'jefe', width: 28 },
      { header: 'Correo', key: 'correo', width: 30 },
      { header: 'Teléfono', key: 'telefono', width: 16 },
      { header: 'Fecha ingreso', key: 'fechaIngreso', width: 14 },
      { header: 'Fecha salida', key: 'fechaSalida', width: 14 },
      { header: 'Tipo contrato', key: 'tipoContrato', width: 20 },
      { header: 'RFC', key: 'rfc', width: 16 },
      { header: 'CURP', key: 'curp', width: 20 },
      { header: 'NSS', key: 'nss', width: 16 },
      { header: 'Salario', key: 'salario', width: 16 },
      { header: 'Estatus', key: 'estatus', width: 12 },
    ];

    const encabezado = hoja.getRow(1);
    encabezado.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    encabezado.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };
    encabezado.alignment = { vertical: 'middle' };
    hoja.views = [{ state: 'frozen', ySplit: 1 }];
    hoja.autoFilter = {
      from: 'A1',
      to: `R${Math.max(empleados.length + 1, 1)}`,
    };

    for (const emp of empleados) {
      const fila = hoja.addRow({
        codigo: emp.codigo,
        nombre: emp.nombre,
        apellidoPaterno: emp.apellidoPaterno,
        apellidoMaterno: emp.apellidoMaterno ?? '',
        departamento: emp.departamento?.nombre ?? '',
        puesto: emp.puesto?.nombre ?? '',
        turno: emp.turno?.nombre ?? '',
        jefe: emp.jefe
          ? nombreCompleto(
              emp.jefe.nombre,
              emp.jefe.apellidoPaterno,
              emp.jefe.apellidoMaterno,
            )
          : '',
        correo: emp.correo ?? '',
        telefono: emp.telefono ?? '',
        fechaIngreso: fechaCorta(emp.fechaIngreso),
        fechaSalida: fechaCorta(emp.fechaSalida),
        tipoContrato: this.tipoContratoTexto(emp),
        rfc: emp.rfc ?? '',
        curp: emp.curp ?? '',
        nss: emp.nss ?? '',
        salario: Number(emp.salario ?? 0),
        estatus: emp.activo ? 'Activo' : 'Inactivo',
      });
      const celdaEstatus = fila.getCell('estatus');
      celdaEstatus.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: emp.activo ? 'FFDCFCE7' : 'FFFEE2E2' },
      };
      celdaEstatus.font = {
        bold: true,
        color: { argb: emp.activo ? 'FF166534' : 'FF991B1B' },
      };
    }

    hoja.getColumn('fechaIngreso').numFmt = 'DD/MM/YYYY';
    hoja.getColumn('fechaSalida').numFmt = 'DD/MM/YYYY';
    hoja.getColumn('salario').numFmt = '"$"#,##0.00';

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const hoy = new Date();
    const sello = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`;
    return { buffer, nombreArchivo: `empleados-${sello}.xlsx` };
  }

  // ==================== Ficha PDF ====================

  private async construirDatosFicha(publicId: string): Promise<DatosFicha> {
    const empresa = obtenerEmpresaReporte();
    const empleado = await this.empleadoRepository.findOne({
      where: { publicId },
      relations: {
        departamento: true,
        puesto: true,
        turno: true,
        jefe: true,
        contratos: true,
      },
    });
    if (!empleado)
      throw new BadRequestException(`El empleado ${publicId} no existe`);

    const completo = nombreCompleto(
      empleado.nombre,
      empleado.apellidoPaterno,
      empleado.apellidoMaterno,
    );
    const jefeNombre = empleado.jefe
      ? nombreCompleto(
          empleado.jefe.nombre,
          empleado.jefe.apellidoPaterno,
          empleado.jefe.apellidoMaterno,
        )
      : '—';
    const antiguedad = antiguedadTexto(empleado.fechaIngreso);
    const tipoContrato = this.tipoContratoTexto(empleado);
    const estadoActivo = empleado.activo ? 'activo' : 'inactivo';

    const carta: SegmentoFicha[][] = [
      [{ texto: 'A quien corresponda:' }],
      [
        { texto: 'Por medio de la presente, se certifica y presenta a ' },
        { texto: completo, negrita: true },
        {
          texto: ` como miembro ${estadoActivo} de nuestro equipo de trabajo en el departamento de `,
        },
        { texto: empleado.departamento?.nombre ?? '—', negrita: true },
        { texto: ', desempeñando el puesto de ' },
        { texto: empleado.puesto?.nombre ?? '—', negrita: true },
        {
          texto: `. Durante su trayectoria en la organización, con una antigüedad de ${antiguedad}, ha demostrado un alto compromiso profesional.`,
        },
      ],
      [
        { texto: 'Su relación laboral se encuentra bajo un contrato de ' },
        { texto: tipoContrato, negrita: true },
        {
          texto: ` con fecha de ingreso del ${fechaLarga(empleado.fechaIngreso)}.`,
        },
      ],
      [
        {
          texto:
            'Esta ficha/carta respalda su rol dentro de la empresa para los fines institucionales, trámites internos o representaciones comerciales que correspondan.',
        },
      ],
    ];

    return {
      empresa: {
        nombre: empresa.nombre,
        correo: empresa.correo,
        telefono: empresa.telefono,
        direccion: empresa.direccion,
        sitio: empresa.sitio,
      },
      logo: await resolverLogoBuffer(empresa.logo),
      foto: uploadUrlABuffer(empleado.foto),
      iniciales:
        `${empleado.nombre.charAt(0)}${empleado.apellidoPaterno.charAt(0)}`.toUpperCase(),
      empleado: {
        nombreCompleto: completo,
        puesto: empleado.puesto?.nombre ?? '—',
        departamento: empleado.departamento?.nombre ?? '—',
        codigo: empleado.codigo,
        estatus: empleado.activo ? 'Activo' : 'Inactivo',
        correo: empleado.correo ?? '—',
        telefono: empleado.telefono ?? '—',
        fechaIngreso: fechaLarga(empleado.fechaIngreso),
        antiguedad,
        ubicacion: empleado.direccion ?? '—',
        tipoContrato,
        turno: empleado.turno?.nombre ?? '—',
        reportaA: jefeNombre,
        rfc: empleado.rfc ?? '',
        curp: empleado.curp ?? '',
        nss: empleado.nss ?? '',
        salario: empleado.salario ? moneda(empleado.salario) : '',
        fechaNacimiento: empleado.fechaNacimiento
          ? fechaLarga(empleado.fechaNacimiento)
          : '',
      },
      tieneDatosFiscales: Boolean(
        empleado.rfc ||
        empleado.curp ||
        empleado.nss ||
        empleado.salario ||
        empleado.fechaNacimiento,
      ),
      carta,
      fechaActual: fechaLarga(new Date()),
    };
  }

  private anchoUtil(doc: DocPdf): number {
    return doc.page.width - doc.page.margins.left - doc.page.margins.right;
  }

  private dibujarEncabezado(doc: DocPdf, datos: DatosFicha) {
    const x0 = doc.page.margins.left;
    const ancho = this.anchoUtil(doc);
    const tope = doc.y;

    const lineas: Array<{ texto: string; negrita?: boolean }> = [
      { texto: datos.empresa.nombre, negrita: true },
      { texto: 'Recursos Humanos | Gestión de Talento' },
    ];
    const contacto = [datos.empresa.correo, datos.empresa.telefono]
      .filter(Boolean)
      .join(' | ');
    if (contacto) lineas.push({ texto: contacto });
    if (datos.empresa.direccion)
      lineas.push({ texto: datos.empresa.direccion });
    if (datos.empresa.sitio) lineas.push({ texto: datos.empresa.sitio });

    let yEmpresa = tope;
    for (const linea of lineas) {
      doc
        .font(linea.negrita ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(9)
        .fillColor(COLORES.tenue)
        .text(linea.texto, x0, yEmpresa, { width: ancho, align: 'right' });
      yEmpresa = doc.y + 2;
    }

    let finLogo = tope;
    if (datos.logo) {
      try {
        doc.image(datos.logo, x0, tope, { fit: [180, 60] });
        finLogo = Math.max(doc.y, tope + 10);
      } catch {
        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor(COLORES.primario)
          .text(datos.empresa.nombre, x0, tope, { width: 220 });
        finLogo = doc.y;
      }
    } else {
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(COLORES.primario)
        .text(datos.empresa.nombre, x0, tope, { width: 220 });
      finLogo = doc.y;
    }

    const finY = Math.max(yEmpresa, finLogo) + 8;
    doc
      .moveTo(x0, finY)
      .lineTo(x0 + ancho, finY)
      .strokeColor(COLORES.primario)
      .lineWidth(2)
      .stroke();
    doc.y = finY + 14;
  }

  private dibujarTarjeta(doc: DocPdf, datos: DatosFicha, esc: EscalaFicha) {
    const e = datos.empleado;
    const x0 = doc.page.margins.left;
    const ancho = this.anchoUtil(doc);
    const tope = doc.y;
    const ladoFoto = esc.foto;
    const pad = esc.pad;
    const xTexto = x0 + pad + ladoFoto + 16;
    const anchoTexto = x0 + ancho - pad - xTexto;

    doc.font('Helvetica-Bold').fontSize(esc.nombre);
    const altoNombre = doc.heightOfString(e.nombreCompleto, {
      width: anchoTexto,
    });
    doc.fontSize(esc.puesto);
    const altoPuesto = doc.heightOfString(e.puesto, { width: anchoTexto });
    const altoBadge = Math.round(esc.badge * 2 + 2);
    const altoTexto =
      altoNombre + esc.gap * 0.5 + altoPuesto + esc.gap + altoBadge;
    const altoTarjeta = Math.max(ladoFoto, altoTexto) + pad * 2;

    doc
      .roundedRect(x0, tope, ancho, altoTarjeta, 6)
      .fillAndStroke(COLORES.fondoClaro, COLORES.borde);

    const fx = x0 + pad;
    const fy = tope + pad;
    let fotoOk = false;
    if (datos.foto) {
      try {
        doc.image(datos.foto, fx, fy, {
          fit: [ladoFoto, ladoFoto],
          align: 'center',
          valign: 'center',
        });
        fotoOk = true;
      } catch {
        fotoOk = false;
      }
    }
    if (!fotoOk) {
      doc.rect(fx, fy, ladoFoto, ladoFoto).fill('#dbeafe');
      const tamIniciales = Math.round(ladoFoto * 0.33);
      doc
        .fillColor(COLORES.primario)
        .font('Helvetica-Bold')
        .fontSize(tamIniciales)
        .text(datos.iniciales, fx, fy + ladoFoto / 2 - tamIniciales * 0.6, {
          width: ladoFoto,
          align: 'center',
        });
    }
    doc
      .roundedRect(fx, fy, ladoFoto, ladoFoto, 6)
      .strokeColor(COLORES.primario)
      .lineWidth(2)
      .stroke();

    let ty = tope + pad + 2;
    doc
      .fillColor(COLORES.primario)
      .font('Helvetica-Bold')
      .fontSize(esc.nombre)
      .text(e.nombreCompleto, xTexto, ty, { width: anchoTexto });
    ty = doc.y + esc.gap * 0.5;
    doc
      .fillColor(COLORES.secundario)
      .font('Helvetica-Bold')
      .fontSize(esc.puesto)
      .text(e.puesto, xTexto, ty, { width: anchoTexto });
    ty = doc.y + esc.gap;

    let bx = xTexto;
    for (const insignia of [
      `Dep: ${e.departamento}`,
      `ID: ${e.codigo}`,
      `Estatus: ${e.estatus}`,
    ]) {
      doc.font('Helvetica-Bold').fontSize(esc.badge);
      const bw = doc.widthOfString(insignia) + 16;
      doc.roundedRect(bx, ty, bw, altoBadge, 4).fill(COLORES.badgeFondo);
      doc
        .fillColor(COLORES.primario)
        .text(insignia, bx + 8, ty + 4, { width: bw - 16 });
      bx += bw + 8;
    }
    doc.y = tope + altoTarjeta + esc.gap + 6;
  }

  private dibujarSeccion(doc: DocPdf, titulo: string, esc: EscalaFicha) {
    const x0 = doc.page.margins.left;
    const ancho = this.anchoUtil(doc);
    if (doc.y > doc.page.height - doc.page.margins.bottom - 110) doc.addPage();
    doc
      .font('Helvetica-Bold')
      .fontSize(esc.seccion)
      .fillColor(COLORES.primario)
      .text(titulo.toUpperCase(), x0, doc.y, { width: ancho });
    const y = doc.y + esc.gap * 0.5;
    doc
      .moveTo(x0, y)
      .lineTo(x0 + ancho, y)
      .strokeColor(COLORES.borde)
      .lineWidth(1)
      .stroke();
    doc.y = y + esc.gap;
  }

  private dibujarGrid(
    doc: DocPdf,
    campos: Array<{ etiqueta: string; valor: string }>,
    esc: EscalaFicha,
  ) {
    const x0 = doc.page.margins.left;
    const ancho = this.anchoUtil(doc);
    const colW = ancho / 2;
    let y = doc.y;
    for (let i = 0; i < campos.length; i += 2) {
      const fila = [campos[i], campos[i + 1]].filter(Boolean);
      doc.fontSize(esc.campo);
      let alto = 0;
      for (const campo of fila) {
        const h =
          doc.heightOfString(campo.etiqueta, { width: colW - 10 }) +
          2 +
          doc.heightOfString(campo.valor || '—', { width: colW - 10 });
        alto = Math.max(alto, h);
      }
      if (y + alto > doc.page.height - doc.page.margins.bottom - 60) {
        doc.addPage();
        y = doc.y;
      }
      fila.forEach((campo, k) => {
        const x = x0 + k * colW;
        doc
          .fillColor(COLORES.tenue)
          .font('Helvetica-Bold')
          .text(campo.etiqueta, x, y, { width: colW - 10 });
        doc
          .fillColor(COLORES.texto)
          .font('Helvetica')
          .text(campo.valor || '—', x, doc.y + 2, { width: colW - 10 });
      });
      y += alto + esc.gap;
    }
    doc.y = y + esc.gap * 0.75;
  }

  private dibujarParrafo(
    doc: DocPdf,
    segmentos: SegmentoFicha[],
    esc: EscalaFicha,
  ) {
    const x0 = doc.page.margins.left;
    const ancho = this.anchoUtil(doc);
    doc.fontSize(esc.carta).fillColor(COLORES.texto);
    segmentos.forEach((segmento, i) => {
      doc.font(segmento.negrita ? 'Helvetica-Bold' : 'Helvetica');
      if (i === 0) {
        doc.text(segmento.texto, x0, doc.y, {
          width: ancho,
          align: 'justify',
          continued: i < segmentos.length - 1,
        });
      } else {
        doc.text(segmento.texto, {
          align: 'justify',
          continued: i < segmentos.length - 1,
        });
      }
    });
    doc.y = doc.y + esc.parrafo;
  }

  private dibujarFirmas(doc: DocPdf, datos: DatosFicha) {
    const x0 = doc.page.margins.left;
    const ancho = this.anchoUtil(doc);
    if (doc.y > doc.page.height - doc.page.margins.bottom - 140) doc.addPage();
    const y = doc.y + 10;
    doc
      .moveTo(x0, y)
      .lineTo(x0 + ancho, y)
      .strokeColor(COLORES.borde)
      .lineWidth(1)
      .stroke();
    const cajaW = 200;
    const yLinea = y + 56;
    const cajas: Array<[number, string]> = [
      [x0, 'Firma del Empleado'],
      [x0 + ancho - cajaW, 'Recursos Humanos'],
    ];
    for (const [x, titulo] of cajas) {
      doc
        .moveTo(x, yLinea)
        .lineTo(x + cajaW, yLinea)
        .strokeColor(COLORES.texto)
        .lineWidth(1)
        .stroke();
      doc
        .fillColor(COLORES.tenue)
        .font('Helvetica')
        .fontSize(9)
        .text(titulo, x, yLinea + 5, { width: cajaW, align: 'center' });
    }
    doc.y = yLinea + 32;
    doc
      .fillColor(COLORES.tenue)
      .fontSize(8)
      .text(
        `Documento generado el ${datos.fechaActual} | ${datos.empresa.nombre}`,
        x0,
        doc.y + 4,
        { width: ancho, align: 'right' },
      );
  }

  async generarFichaPdf(
    publicId: string,
  ): Promise<{ buffer: Buffer; nombreArchivo: string }> {
    const datos = await this.construirDatosFicha(publicId);
    let buffer: Buffer | null = null;
    for (const factor of [1, 0.88, 0.78]) {
      const intento = await this.renderizarFicha(datos, escalaFicha(factor));
      if (intento.paginas <= 1 || factor === 0.78) {
        buffer = intento.buffer;
        break;
      }
    }
    const codigoSeguro =
      datos.empleado.codigo.replace(/[^A-Za-z0-9-_]/g, '_') || 'empleado';
    return {
      buffer: buffer as Buffer,
      nombreArchivo: `ficha-${codigoSeguro}.pdf`,
    };
  }

  private renderizarFicha(
    datos: DatosFicha,
    esc: EscalaFicha,
  ): Promise<{ buffer: Buffer; paginas: number }> {
    return new Promise((resolver, rechazar) => {
      const doc = new PDFDocument({
        size: 'A4',
        bufferPages: true,
        margins: { top: 40, bottom: 36, left: 46, right: 46 },
        info: {
          Title: `Ficha de Empleado - ${datos.empleado.nombreCompleto}`,
          Author: datos.empresa.nombre,
        },
      });
      const partes: Buffer[] = [];
      let paginas = 1;
      doc.on('data', (parte: Buffer) =>
        partes.push(Buffer.isBuffer(parte) ? parte : Buffer.from(parte)),
      );
      doc.on('end', () => resolver({ buffer: Buffer.concat(partes), paginas }));
      doc.on('error', rechazar);

      try {
        const e = datos.empleado;
        this.dibujarEncabezado(doc, datos);
        this.dibujarTarjeta(doc, datos, esc);
        this.dibujarSeccion(doc, 'Información del Colaborador', esc);
        this.dibujarGrid(
          doc,
          [
            { etiqueta: 'Correo Electrónico:', valor: e.correo },
            { etiqueta: 'Teléfono de Contacto:', valor: e.telefono },
            { etiqueta: 'Fecha de Ingreso:', valor: e.fechaIngreso },
            { etiqueta: 'Antigüedad:', valor: e.antiguedad },
            { etiqueta: 'Ubicación / Sede:', valor: e.ubicacion },
            { etiqueta: 'Tipo de Contrato:', valor: e.tipoContrato },
            { etiqueta: 'Turno:', valor: e.turno },
            { etiqueta: 'Reporta a:', valor: e.reportaA },
          ],
          esc,
        );
        if (datos.tieneDatosFiscales) {
          this.dibujarSeccion(doc, 'Datos Fiscales y Nómina', esc);
          this.dibujarGrid(
            doc,
            [
              e.rfc ? { etiqueta: 'RFC:', valor: e.rfc } : null,
              e.curp ? { etiqueta: 'CURP:', valor: e.curp } : null,
              e.nss ? { etiqueta: 'NSS:', valor: e.nss } : null,
              e.salario ? { etiqueta: 'Salario:', valor: e.salario } : null,
              e.fechaNacimiento
                ? { etiqueta: 'Fecha de Nacimiento:', valor: e.fechaNacimiento }
                : null,
            ].filter(
              (campo): campo is { etiqueta: string; valor: string } =>
                campo !== null,
            ),
            esc,
          );
        }
        this.dibujarSeccion(doc, 'Carta de Presentación / Perfil', esc);
        for (const parrafo of datos.carta)
          this.dibujarParrafo(doc, parrafo, esc);
        this.dibujarFirmas(doc, datos);
        paginas = doc.bufferedPageRange().count;
      } catch (error) {
        rechazar(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      doc.end();
    });
  }
}
