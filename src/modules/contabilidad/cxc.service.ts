import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  LessThan,
  MoreThan,
  Repository,
} from 'typeorm';
import { CuentaPorCobrar } from './entities/cuenta-por-cobrar.entity';
import { CobroCxC } from './entities/cobro-cxc.entity';
import { PolizaDetalle } from './entities/poliza-detalle.entity';
import { Poliza } from './entities/poliza.entity';
import { CuentaContable } from './entities/cuenta-contable.entity';
import { Venta } from '../ventas/entities/venta.entity';
import { Cliente } from '../ventas/entities/cliente.entity';
import { CreateCobroDto } from './dto/create-cobro.dto';
import { CreateCobroMultipleDto } from './dto/create-cobro-multiple.dto';
import { CreateCxcManualDto } from './dto/create-cxc-manual.dto';
import { FiltrarCarteraDto } from './dto/filtrar-cartera.dto';
import { IntegracionContableService } from './integracion-contable.service';
import { FoliosService } from './folios.service';
import { CuentasService } from './cuentas.service';
import { CentrosCostoService } from './centros-costo.service';
import { cuentaCobroPorMetodo } from './contabilidad.constants';

@Injectable()
export class CxcService {
  constructor(
    @InjectRepository(CuentaPorCobrar)
    private readonly cuentaRepository: Repository<CuentaPorCobrar>,
    @InjectRepository(CobroCxC)
    private readonly cobroRepository: Repository<CobroCxC>,
    private readonly dataSource: DataSource,
    private readonly integracionContableService: IntegracionContableService,
    private readonly foliosService: FoliosService,
    private readonly cuentasService: CuentasService,
    private readonly centrosCostoService: CentrosCostoService,
  ) {}

  async crearDesdeVenta(
    venta: Venta,
    usuarioId: number,
    manager?: EntityManager,
  ) {
    if (manager) {
      return this.crearDesdeVentaEnTransaccion(manager, venta, usuarioId);
    }
    return this.dataSource.transaction((managerTx) =>
      this.crearDesdeVentaEnTransaccion(managerTx, venta, usuarioId),
    );
  }

  private async crearDesdeVentaEnTransaccion(
    manager: EntityManager,
    venta: Venta,
    usuarioId: number,
  ) {
    const cuentaRepo = manager.getRepository(CuentaPorCobrar);
    const existente = await cuentaRepo.findOne({
      where: { ventaId: venta.id },
    });
    if (existente) return existente;

    const total = this.redondear2(Number(venta.total));
    const fecha = this.fechaString(venta.fechaVenta);
    const cuentaIngreso = await this.cuentasService.buscarPorCodigo(
      '4101',
      manager,
    );

    const cuenta = await cuentaRepo.save(
      cuentaRepo.create({
        folio: `CXC-${venta.folio}`,
        ventaId: venta.id,
        clienteId: venta.clienteId,
        fechaEmision: fecha,
        fechaVencimiento: this.sumarDias(fecha, 30),
        monto: total,
        subtotal: this.redondear2(Number(venta.subtotal)),
        iva: this.redondear2(Number(venta.iva)),
        saldo: total,
        estatus: 'pendiente',
        observaciones: null,
        usuarioId,
        polizaId: null,
        cuentaContableId: cuentaIngreso.id,
      }),
    );

    const poliza = await this.integracionContableService.registrarVenta(
      venta,
      usuarioId,
      manager,
      venta.centroCostoId,
    );
    await cuentaRepo.update(cuenta.id, { polizaId: poliza.id });
    cuenta.polizaId = poliza.id;

    return cuenta;
  }

  async crearManual(dto: CreateCxcManualDto, usuarioId: number) {
    const cliente = await this.dataSource.getRepository(Cliente).findOne({
      where: { publicId: dto.clienteId },
    });
    if (!cliente) {
      throw new BadRequestException(`El cliente ${dto.clienteId} no existe`);
    }

    const monto = this.redondear2(dto.monto);
    const iva = this.redondear2(dto.iva ?? 0);
    if (monto <= 0) {
      throw new BadRequestException('El monto debe ser mayor a 0');
    }
    if (iva < 0 || iva > monto) {
      throw new BadRequestException(
        'El IVA debe ser mayor o igual a 0 y no puede superar el monto',
      );
    }
    const subtotal = this.redondear2(monto - iva);

    const cuentaContable = dto.cuentaIngresoId
      ? await this.cuentasService.buscarPorId(dto.cuentaIngresoId)
      : await this.cuentasService.buscarPorCodigo('4101');
    if (cuentaContable.tipo !== 'ingreso') {
      throw new BadRequestException(
        `La cuenta ${cuentaContable.codigo} debe ser de tipo ingreso`,
      );
    }
    if (!cuentaContable.activo || !cuentaContable.permiteMovimientos) {
      throw new BadRequestException(
        `La cuenta ${cuentaContable.codigo} no está activa o no permite movimientos`,
      );
    }

    let centroCostoId: number | null = null;
    if (dto.centroCostoId) {
      const centro = await this.centrosCostoService.buscarPorId(
        dto.centroCostoId,
      );
      if (!centro.activo) {
        throw new BadRequestException(
          `El centro de costo ${centro.codigo} está inactivo`,
        );
      }
      centroCostoId = centro.id;
    }

    const fechaEmision = dto.fechaEmision;
    const fechaVencimiento =
      dto.fechaVencimiento ?? this.sumarDias(fechaEmision, 30);
    if (fechaVencimiento < fechaEmision) {
      throw new BadRequestException(
        'La fecha de vencimiento no puede ser anterior a la fecha de emisión',
      );
    }

    const cuentaId = await this.dataSource.transaction(async (manager) => {
      const secuencial = await this.foliosService.siguiente('cxc', {}, manager);
      const folio = `CXC-MAN-${this.fechaCompacta()}-${String(secuencial).padStart(4, '0')}`;
      const cuentaRepo = manager.getRepository(CuentaPorCobrar);
      const guardada = await cuentaRepo.save(
        cuentaRepo.create({
          folio,
          ventaId: null,
          clienteId: cliente.id,
          fechaEmision,
          fechaVencimiento,
          monto,
          subtotal,
          iva,
          saldo: monto,
          estatus: 'pendiente',
          observaciones: dto.observaciones ?? dto.concepto,
          usuarioId,
          polizaId: null,
          cuentaContableId: cuentaContable.id,
        }),
      );

      const poliza = await this.integracionContableService.registrarCxcManual(
        folio,
        fechaEmision,
        subtotal,
        iva,
        cuentaContable.codigo,
        dto.concepto,
        usuarioId,
        manager,
        centroCostoId,
      );
      await cuentaRepo.update(guardada.id, { polizaId: poliza.id });
      return guardada.id;
    });

    const creada = await this.cuentaRepository.findOne({
      where: { id: cuentaId },
    });
    if (!creada) {
      throw new BadRequestException('No se pudo crear la cuenta por cobrar');
    }
    return this.buscarPorId(creada.publicId);
  }

  async buscar() {
    return this.cuentaRepository.find({
      relations: {
        cliente: true,
        venta: true,
        poliza: true,
        polizaCancelacion: true,
        cuentaContable: true,
      },
      order: { fechaVencimiento: 'ASC', id: 'DESC' },
    });
  }

  async paginar(query: FiltrarCarteraDto) {
    const { estatus, vencidas, ...paginacion } = query;
    const { registros = 10, pagina = 1 } = paginacion;
    const where: any = {};

    if (vencidas) {
      where.fechaVencimiento = LessThan(this.hoy());
      where.saldo = MoreThan(0);
      if (!estatus) where.estatus = In(['pendiente', 'parcial']);
    } else if (estatus) {
      where.estatus = estatus;
    }

    const [data, total] = await this.cuentaRepository.findAndCount({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: {
        cliente: true,
        venta: true,
        poliza: true,
        polizaCancelacion: true,
        cuentaContable: true,
      },
      order: { fechaVencimiento: 'ASC', id: 'DESC' },
    });
    return { total, data };
  }

  async buscarPorId(publicId: string) {
    const item = await this.cuentaRepository.findOne({
      where: { publicId },
      relations: {
        cliente: true,
        venta: true,
        poliza: true,
        polizaCancelacion: true,
        cuentaContable: true,
        cobros: {
          usuario: true,
          poliza: true,
        },
      },
    });
    if (!item) {
      throw new BadRequestException(
        `La cuenta por cobrar ${publicId} no existe`,
      );
    }
    item.cobros?.sort((a, b) => a.fecha.localeCompare(b.fecha));
    return item;
  }

  async registrarCobro(
    publicId: string,
    dto: CreateCobroDto,
    usuarioId: number,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const cuentaRepo = manager.getRepository(CuentaPorCobrar);
      const cuenta = await cuentaRepo.findOne({
        where: { publicId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!cuenta) {
        throw new BadRequestException(
          `La cuenta por cobrar ${publicId} no existe`,
        );
      }
      if (cuenta.estatus === 'cancelada' || cuenta.estatus === 'pagada') {
        throw new BadRequestException(
          `La cuenta está ${cuenta.estatus}, no se puede cobrar`,
        );
      }

      const saldo = Number(cuenta.saldo);
      const monto = this.redondear2(dto.monto);
      if (monto <= 0 || monto > saldo) {
        throw new BadRequestException(
          `El monto debe ser mayor a 0 y menor o igual al saldo (${cuenta.saldo})`,
        );
      }

      const poliza = await this.integracionContableService.registrarCobro(
        dto.fecha,
        monto,
        dto.metodoPago,
        usuarioId,
        manager,
      );

      const cobroRepo = manager.getRepository(CobroCxC);
      await cobroRepo.save(
        cobroRepo.create({
          cuentaPorCobrarId: cuenta.id,
          fecha: dto.fecha,
          monto,
          metodoPago: dto.metodoPago,
          referencia: dto.referencia ?? null,
          observaciones: dto.observaciones ?? null,
          usuarioId,
          polizaId: poliza.id,
        }),
      );

      const nuevoSaldo = this.redondear2(saldo - monto);
      await cuentaRepo.update(cuenta.id, {
        saldo: nuevoSaldo,
        estatus: nuevoSaldo === 0 ? 'pagada' : 'parcial',
        fechaActualizacion: new Date(),
      });
    });

    return this.buscarPorId(publicId);
  }

  async registrarCobroMultiple(dto: CreateCobroMultipleDto, usuarioId: number) {
    const aplicaciones = dto.aplicaciones.map((aplicacion) => ({
      cuentaId: aplicacion.cuentaId,
      monto: this.redondear2(aplicacion.monto),
    }));
    if (aplicaciones.some((aplicacion) => aplicacion.monto <= 0)) {
      throw new BadRequestException(
        'Cada aplicación debe tener un monto mayor a 0',
      );
    }

    const publicIds = aplicaciones.map((aplicacion) => aplicacion.cuentaId);
    if (new Set(publicIds).size !== publicIds.length) {
      throw new BadRequestException(
        'No se puede aplicar un cobro dos veces a la misma cuenta',
      );
    }

    const total = this.redondear2(
      aplicaciones.reduce((suma, aplicacion) => suma + aplicacion.monto, 0),
    );
    const montos = new Map(
      aplicaciones.map((aplicacion) => [aplicacion.cuentaId, aplicacion.monto]),
    );

    return this.dataSource.transaction(async (manager) => {
      const cuentaRepo = manager.getRepository(CuentaPorCobrar);
      const referencias = await cuentaRepo.find({
        where: { publicId: In(publicIds) },
        select: { id: true, publicId: true },
      });
      if (referencias.length !== publicIds.length) {
        throw new BadRequestException(
          'Una o más cuentas por cobrar no existen',
        );
      }

      const cuentas: CuentaPorCobrar[] = [];
      for (const referencia of referencias.sort((a, b) => a.id - b.id)) {
        const cuenta = await cuentaRepo.findOne({
          where: { id: referencia.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!cuenta) {
          throw new BadRequestException(
            `La cuenta por cobrar ${referencia.publicId} no existe`,
          );
        }
        cuentas.push(cuenta);
      }

      const clienteId = cuentas[0]?.clienteId;
      if (cuentas.some((cuenta) => cuenta.clienteId !== clienteId)) {
        throw new BadRequestException(
          'Todas las cuentas por cobrar deben ser del mismo cliente',
        );
      }

      for (const cuenta of cuentas) {
        const monto = montos.get(cuenta.publicId) ?? 0;
        if (cuenta.estatus === 'cancelada' || cuenta.estatus === 'pagada') {
          throw new BadRequestException(
            `La cuenta ${cuenta.folio} está ${cuenta.estatus}, no se puede cobrar`,
          );
        }
        if (monto > Number(cuenta.saldo)) {
          throw new BadRequestException(
            `El monto aplicado a ${cuenta.folio} supera su saldo (${cuenta.saldo})`,
          );
        }
      }

      const poliza = await this.integracionContableService.registrarCobro(
        dto.fecha,
        total,
        dto.metodoPago,
        usuarioId,
        manager,
      );
      const polizaCompleta = await manager
        .getRepository(Poliza)
        .findOne({ where: { id: poliza.id } });
      const cobroRepo = manager.getRepository(CobroCxC);
      const resultado: Array<{
        cobroId: number;
        cuenta: { publicId: string; folio: string };
        monto: number;
        saldoAnterior: number;
        saldo: number;
        estatus: string;
      }> = [];

      for (const cuenta of cuentas) {
        const monto = montos.get(cuenta.publicId) ?? 0;
        const saldoAnterior = this.redondear2(Number(cuenta.saldo));
        const nuevoSaldo = this.redondear2(saldoAnterior - monto);
        const cobro = await cobroRepo.save(
          cobroRepo.create({
            cuentaPorCobrarId: cuenta.id,
            fecha: dto.fecha,
            monto,
            metodoPago: dto.metodoPago,
            referencia: dto.referencia ?? null,
            observaciones: dto.observaciones ?? null,
            usuarioId,
            polizaId: poliza.id,
          }),
        );
        const estatus = nuevoSaldo === 0 ? 'pagada' : 'parcial';
        await cuentaRepo.update(cuenta.id, {
          saldo: nuevoSaldo,
          estatus,
          fechaActualizacion: new Date(),
        });
        resultado.push({
          cobroId: cobro.id,
          cuenta: { publicId: cuenta.publicId, folio: cuenta.folio },
          monto,
          saldoAnterior,
          saldo: nuevoSaldo,
          estatus,
        });
      }

      return {
        total,
        poliza: polizaCompleta
          ? { publicId: polizaCompleta.publicId, folio: polizaCompleta.folio }
          : { folio: poliza.folio },
        aplicaciones: resultado,
      };
    });
  }

  async cancelar(publicId: string, usuarioId: number, manager?: EntityManager) {
    const ejecutar = async (managerTx: EntityManager) => {
      const cuentaRepo = managerTx.getRepository(CuentaPorCobrar);
      const cuenta = await cuentaRepo.findOne({
        where: { publicId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!cuenta) {
        throw new BadRequestException(
          `La cuenta por cobrar ${publicId} no existe`,
        );
      }
      if (cuenta.estatus === 'cancelada') {
        throw new BadRequestException('La cuenta ya está cancelada');
      }

      await this.cancelarCuentaEnTransaccion(managerTx, cuenta, usuarioId);
      return { msg: 'Cuenta por cobrar cancelada exitosamente' };
    };

    if (manager) return ejecutar(manager);
    return this.dataSource.transaction(ejecutar);
  }

  async cancelarPorVenta(
    ventaId: number,
    usuarioId: number,
    manager?: EntityManager,
  ) {
    const ejecutar = async (managerTx: EntityManager) => {
      const cuentaRepo = managerTx.getRepository(CuentaPorCobrar);
      const cuenta = await cuentaRepo.findOne({
        where: { ventaId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!cuenta || cuenta.estatus === 'cancelada') return;

      await this.cancelarCuentaEnTransaccion(managerTx, cuenta, usuarioId);
    };

    if (manager) return ejecutar(manager);
    return this.dataSource.transaction(ejecutar);
  }

  /**
   * Cancela la CxC y genera una nota de crédito que revierte la venta y
   * reembolsa los cobros ya aplicados.
   */
  private async cancelarCuentaEnTransaccion(
    manager: EntityManager,
    cuenta: CuentaPorCobrar,
    usuarioId: number,
  ) {
    const total = this.redondear2(Number(cuenta.monto));
    const reembolsos = await this.reembolsosCobros(manager, cuenta.id);
    const cobrado = this.redondear2(
      reembolsos.reduce((suma, item) => suma + item.monto, 0),
    );
    const venta = cuenta.ventaId
      ? await manager.getRepository(Venta).findOne({
          where: { id: cuenta.ventaId },
        })
      : null;
    const totalReverso = this.redondear2(Number(venta?.total ?? total));
    const iva = this.redondear2(Number(venta?.iva ?? cuenta.iva ?? 0));
    const saldo = this.redondear2(totalReverso - cobrado);

    let cuentaIngreso = '4101';
    if (cuenta.cuentaContableId) {
      const cuentaContable = await manager
        .getRepository(CuentaContable)
        .findOne({ where: { id: cuenta.cuentaContableId } });
      if (cuentaContable) cuentaIngreso = cuentaContable.codigo;
    }

    const poliza =
      await this.integracionContableService.registrarCancelacionVenta(
        venta?.folio ?? cuenta.folio,
        totalReverso,
        iva,
        saldo,
        reembolsos,
        usuarioId,
        manager,
        cuentaIngreso,
        venta ? 'venta' : 'cuenta por cobrar',
        venta?.centroCostoId,
      );

    await manager.getRepository(CuentaPorCobrar).update(cuenta.id, {
      estatus: 'cancelada',
      saldo: 0,
      polizaCancelacionId: poliza.id,
      fechaActualizacion: new Date(),
    });
  }

  /**
   * Agrupa los cobros por la cuenta contable que se acreditó originalmente.
   * Si el cobro no tiene póliza (datos históricos), usa el mapeo del método.
   */
  private async reembolsosCobros(
    manager: EntityManager,
    cuentaId: number,
  ): Promise<Array<{ codigo: string; monto: number }>> {
    const cobros = await manager.getRepository(CobroCxC).find({
      where: { cuentaPorCobrarId: cuentaId },
    });
    if (!cobros.length) return [];

    const polizaIds = cobros
      .map((cobro) => cobro.polizaId)
      .filter((id): id is number => !!id);
    const detalles = polizaIds.length
      ? await manager.getRepository(PolizaDetalle).find({
          where: { polizaId: In(polizaIds), debe: MoreThan(0) },
          relations: { cuenta: true },
          order: { id: 'ASC' },
        })
      : [];

    const cuentaPorPoliza = new Map<number, string>();
    for (const detalle of detalles) {
      if (!detalle.cuenta || detalle.cuenta.codigo === '1103') continue;
      if (!cuentaPorPoliza.has(detalle.polizaId)) {
        cuentaPorPoliza.set(detalle.polizaId, detalle.cuenta.codigo);
      }
    }

    const acumulado = new Map<string, number>();
    for (const cobro of cobros) {
      const codigo =
        (cobro.polizaId ? cuentaPorPoliza.get(cobro.polizaId) : undefined) ??
        cuentaCobroPorMetodo(cobro.metodoPago);
      const monto = this.redondear2(Number(cobro.monto));
      if (monto <= 0) continue;
      acumulado.set(
        codigo,
        this.redondear2((acumulado.get(codigo) ?? 0) + monto),
      );
    }

    return [...acumulado.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([codigo, monto]) => ({ codigo, monto }));
  }

  private hoy() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private fechaString(fecha: Date | string) {
    if (typeof fecha === 'string') return fecha.slice(0, 10);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private fechaCompacta() {
    return this.fechaString(new Date()).replaceAll('-', '');
  }

  private sumarDias(fecha: string, dias: number) {
    const valor = new Date(`${fecha}T00:00:00.000Z`);
    valor.setUTCDate(valor.getUTCDate() + dias);
    return valor.toISOString().slice(0, 10);
  }

  private redondear2(valor: number) {
    return Math.round(valor * 100) / 100;
  }
}
