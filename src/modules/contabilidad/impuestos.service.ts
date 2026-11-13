import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DeclaracionIva } from './entities/declaracion-iva.entity';
import { DeclararIvaDto } from './dto/declarar-iva.dto';
import { DeclaracionesIvaQueryDto } from './dto/declaraciones-iva.query.dto';
import { ReportesContablesService } from './reportes-contables.service';
import { CuentasService } from './cuentas.service';
import { IntegracionContableService } from './integracion-contable.service';

@Injectable()
export class ImpuestosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly reportesContablesService: ReportesContablesService,
    private readonly cuentasService: CuentasService,
    private readonly integracionContableService: IntegracionContableService,
  ) {}

  async declarar(dto: DeclararIvaDto, usuarioId: number) {
    const mes = this.pad2(dto.mes);
    const desde = `${dto.anio}-${mes}-01`;
    const ultimoDia = new Date(Date.UTC(dto.anio, dto.mes, 0)).getUTCDate();
    const hasta = `${dto.anio}-${mes}-${String(ultimoDia).padStart(2, '0')}`;

    const reporte = await this.reportesContablesService.iva({ desde, hasta });
    if (reporte.trasladado === 0 && reporte.acreditable === 0) {
      throw new BadRequestException(
        `No hay movimientos de IVA en ${dto.anio}-${mes}`,
      );
    }

    const cuentaPago = dto.cuentaPagoId
      ? await this.cuentasService.buscarPorId(dto.cuentaPagoId)
      : await this.cuentasService.buscarPorCodigo('1102');
    if (
      cuentaPago.tipo !== 'activo' ||
      !cuentaPago.activo ||
      !cuentaPago.permiteMovimientos
    ) {
      throw new BadRequestException(
        `La cuenta ${cuentaPago.codigo} no es una cuenta de pago válida`,
      );
    }

    const fecha = dto.fecha ?? this.hoy();

    try {
      const declaracionId = await this.dataSource.transaction(
        async (manager) => {
          const repositorio = manager.getRepository(DeclaracionIva);
          const existente = await repositorio.findOne({
            where: { anio: dto.anio, mes: dto.mes },
          });
          if (existente) {
            throw new BadRequestException(
              `El periodo ${dto.anio}-${mes} ya fue declarado`,
            );
          }

          const poliza =
            await this.integracionContableService.registrarDeclaracionIva(
              fecha,
              dto.anio,
              dto.mes,
              reporte.trasladado,
              reporte.acreditable,
              cuentaPago.codigo,
              usuarioId,
              manager,
            );

          const declaracion = await repositorio.save(
            repositorio.create({
              anio: dto.anio,
              mes: dto.mes,
              fecha,
              trasladado: reporte.trasladado,
              acreditable: reporte.acreditable,
              neto: reporte.neto,
              porPagar: reporte.porPagar,
              saldoFavor: reporte.saldoFavor,
              estatus: reporte.porPagar > 0 ? 'pagada' : 'declarada',
              polizaId: poliza?.id ?? null,
              usuarioId,
            }),
          );
          return declaracion.id;
        },
      );

      return this.buscarPorIdInterno(declaracionId);
    } catch (error) {
      if (this.esDuplicado(error)) {
        throw new BadRequestException(
          `El periodo ${dto.anio}-${mes} ya fue declarado`,
        );
      }
      throw error;
    }
  }

  async listar(query: DeclaracionesIvaQueryDto) {
    return this.dataSource.getRepository(DeclaracionIva).find({
      where: query.anio ? { anio: query.anio } : {},
      relations: { poliza: true, usuario: true },
      order: { anio: 'DESC', mes: 'DESC' },
    });
  }

  async buscarPorId(publicId: string) {
    const item = await this.dataSource.getRepository(DeclaracionIva).findOne({
      where: { publicId },
      relations: { poliza: true, usuario: true },
    });
    if (!item) {
      throw new BadRequestException(`La declaración ${publicId} no existe`);
    }
    return item;
  }

  private async buscarPorIdInterno(id: number) {
    const item = await this.dataSource.getRepository(DeclaracionIva).findOne({
      where: { id },
      relations: { poliza: true, usuario: true },
    });
    if (!item) {
      throw new BadRequestException(`La declaración ${id} no existe`);
    }
    return item;
  }

  private esDuplicado(error: unknown) {
    const detalle = error as {
      code?: string;
      driverError?: { code?: string };
    };
    return detalle?.driverError?.code === '23505' || detalle?.code === '23505';
  }

  private hoy() {
    const fecha = new Date();
    return `${fecha.getFullYear()}-${this.pad2(fecha.getMonth() + 1)}-${this.pad2(fecha.getDate())}`;
  }

  private pad2(valor: number) {
    return String(valor).padStart(2, '0');
  }
}
