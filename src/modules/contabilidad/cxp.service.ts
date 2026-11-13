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
import { CuentaPorPagar } from './entities/cuenta-por-pagar.entity';
import { PagoCxP } from './entities/pago-cxp.entity';
import { PolizaDetalle } from './entities/poliza-detalle.entity';
import { Poliza } from './entities/poliza.entity';
import { CuentaContable } from './entities/cuenta-contable.entity';
import { Compra } from '../compras/entities/compra.entity';
import { Proveedor } from '../compras/entities/proveedor.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { CreatePagoMultipleDto } from './dto/create-pago-multiple.dto';
import { CreateCxpManualDto } from './dto/create-cxp-manual.dto';
import { FiltrarCarteraDto } from './dto/filtrar-cartera.dto';
import { IntegracionContableService } from './integracion-contable.service';
import { FoliosService } from './folios.service';
import { CuentasService } from './cuentas.service';
import { CentrosCostoService } from './centros-costo.service';
import { cuentaPagoPorMetodo } from './contabilidad.constants';

@Injectable()
export class CxpService {
  constructor(
    @InjectRepository(CuentaPorPagar)
    private readonly cuentaRepository: Repository<CuentaPorPagar>,
    @InjectRepository(PagoCxP)
    private readonly pagoRepository: Repository<PagoCxP>,
    private readonly dataSource: DataSource,
    private readonly integracionContableService: IntegracionContableService,
    private readonly foliosService: FoliosService,
    private readonly cuentasService: CuentasService,
    private readonly centrosCostoService: CentrosCostoService,
  ) {}

  async crearDesdeCompra(
    compra: Compra,
    usuarioId: number,
    manager?: EntityManager,
  ) {
    if (manager) {
      return this.crearDesdeCompraEnTransaccion(manager, compra, usuarioId);
    }
    return this.dataSource.transaction((managerTx) =>
      this.crearDesdeCompraEnTransaccion(managerTx, compra, usuarioId),
    );
  }

  private async crearDesdeCompraEnTransaccion(
    manager: EntityManager,
    compra: Compra,
    usuarioId: number,
  ) {
    const cuentaRepo = manager.getRepository(CuentaPorPagar);
    const existente = await cuentaRepo.findOne({
      where: { compraId: compra.id },
    });
    if (existente) return existente;

    const total = this.redondear2(Number(compra.total));
    const fecha = this.fechaString(compra.fechaCompra);
    const cuentaCargo = await this.cuentasService.buscarPorCodigo(
      '1105',
      manager,
    );

    const cuenta = await cuentaRepo.save(
      cuentaRepo.create({
        folio: `CXP-${compra.folio}`,
        compraId: compra.id,
        proveedorId: compra.proveedorId,
        fechaEmision: fecha,
        fechaVencimiento: this.sumarDias(fecha, 30),
        monto: total,
        subtotal: this.redondear2(Number(compra.subtotal)),
        iva: this.redondear2(Number(compra.iva)),
        saldo: total,
        estatus: 'pendiente',
        observaciones: null,
        usuarioId,
        polizaId: null,
        cuentaContableId: cuentaCargo.id,
      }),
    );

    const poliza = await this.integracionContableService.registrarCompra(
      compra,
      usuarioId,
      manager,
      compra.centroCostoId,
    );
    await cuentaRepo.update(cuenta.id, { polizaId: poliza.id });
    cuenta.polizaId = poliza.id;

    return cuenta;
  }

  async crearManual(dto: CreateCxpManualDto, usuarioId: number) {
    const proveedor = await this.dataSource.getRepository(Proveedor).findOne({
      where: { publicId: dto.proveedorId },
    });
    if (!proveedor) {
      throw new BadRequestException(
        `El proveedor ${dto.proveedorId} no existe`,
      );
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

    const cuentaContable = dto.cuentaCargoId
      ? await this.cuentasService.buscarPorId(dto.cuentaCargoId)
      : await this.cuentasService.buscarPorCodigo('5102');
    if (cuentaContable.tipo !== 'gasto' && cuentaContable.tipo !== 'activo') {
      throw new BadRequestException(
        `La cuenta ${cuentaContable.codigo} debe ser de tipo gasto o activo`,
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
      const secuencial = await this.foliosService.siguiente('cxp', {}, manager);
      const folio = `CXP-MAN-${this.fechaCompacta()}-${String(secuencial).padStart(4, '0')}`;
      const cuentaRepo = manager.getRepository(CuentaPorPagar);
      const guardada = await cuentaRepo.save(
        cuentaRepo.create({
          folio,
          compraId: null,
          proveedorId: proveedor.id,
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

      const poliza = await this.integracionContableService.registrarCxpManual(
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
      throw new BadRequestException('No se pudo crear la cuenta por pagar');
    }
    return this.buscarPorId(creada.publicId);
  }

  async buscar() {
    return this.cuentaRepository.find({
      relations: {
        proveedor: true,
        compra: true,
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
        proveedor: true,
        compra: true,
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
        proveedor: true,
        compra: true,
        poliza: true,
        polizaCancelacion: true,
        cuentaContable: true,
        pagos: {
          usuario: true,
          poliza: true,
        },
      },
    });
    if (!item) {
      throw new BadRequestException(
        `La cuenta por pagar ${publicId} no existe`,
      );
    }
    item.pagos?.sort((a, b) => a.fecha.localeCompare(b.fecha));
    return item;
  }

  async registrarPago(publicId: string, dto: CreatePagoDto, usuarioId: number) {
    await this.dataSource.transaction(async (manager) => {
      const cuentaRepo = manager.getRepository(CuentaPorPagar);
      const cuenta = await cuentaRepo.findOne({
        where: { publicId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!cuenta) {
        throw new BadRequestException(
          `La cuenta por pagar ${publicId} no existe`,
        );
      }
      if (cuenta.estatus === 'cancelada' || cuenta.estatus === 'pagada') {
        throw new BadRequestException(
          `La cuenta está ${cuenta.estatus}, no se puede pagar`,
        );
      }

      const saldo = Number(cuenta.saldo);
      const monto = this.redondear2(dto.monto);
      if (monto <= 0 || monto > saldo) {
        throw new BadRequestException(
          `El monto debe ser mayor a 0 y menor o igual al saldo (${cuenta.saldo})`,
        );
      }

      const poliza = await this.integracionContableService.registrarPago(
        dto.fecha,
        monto,
        dto.metodoPago,
        usuarioId,
        manager,
      );

      const pagoRepo = manager.getRepository(PagoCxP);
      await pagoRepo.save(
        pagoRepo.create({
          cuentaPorPagarId: cuenta.id,
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

  async registrarPagoMultiple(dto: CreatePagoMultipleDto, usuarioId: number) {
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
        'No se puede aplicar un pago dos veces a la misma cuenta',
      );
    }

    const total = this.redondear2(
      aplicaciones.reduce((suma, aplicacion) => suma + aplicacion.monto, 0),
    );
    const montos = new Map(
      aplicaciones.map((aplicacion) => [aplicacion.cuentaId, aplicacion.monto]),
    );

    return this.dataSource.transaction(async (manager) => {
      const cuentaRepo = manager.getRepository(CuentaPorPagar);
      const referencias = await cuentaRepo.find({
        where: { publicId: In(publicIds) },
        select: { id: true, publicId: true },
      });
      if (referencias.length !== publicIds.length) {
        throw new BadRequestException('Una o más cuentas por pagar no existen');
      }

      const cuentas: CuentaPorPagar[] = [];
      for (const referencia of referencias.sort((a, b) => a.id - b.id)) {
        const cuenta = await cuentaRepo.findOne({
          where: { id: referencia.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!cuenta) {
          throw new BadRequestException(
            `La cuenta por pagar ${referencia.publicId} no existe`,
          );
        }
        cuentas.push(cuenta);
      }

      const proveedorId = cuentas[0]?.proveedorId;
      if (cuentas.some((cuenta) => cuenta.proveedorId !== proveedorId)) {
        throw new BadRequestException(
          'Todas las cuentas por pagar deben ser del mismo proveedor',
        );
      }

      for (const cuenta of cuentas) {
        const monto = montos.get(cuenta.publicId) ?? 0;
        if (cuenta.estatus === 'cancelada' || cuenta.estatus === 'pagada') {
          throw new BadRequestException(
            `La cuenta ${cuenta.folio} está ${cuenta.estatus}, no se puede pagar`,
          );
        }
        if (monto > Number(cuenta.saldo)) {
          throw new BadRequestException(
            `El monto aplicado a ${cuenta.folio} supera su saldo (${cuenta.saldo})`,
          );
        }
      }

      const poliza = await this.integracionContableService.registrarPago(
        dto.fecha,
        total,
        dto.metodoPago,
        usuarioId,
        manager,
      );
      const polizaCompleta = await manager
        .getRepository(Poliza)
        .findOne({ where: { id: poliza.id } });
      const pagoRepo = manager.getRepository(PagoCxP);
      const resultado: Array<{
        pagoId: number;
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
        const pago = await pagoRepo.save(
          pagoRepo.create({
            cuentaPorPagarId: cuenta.id,
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
          pagoId: pago.id,
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
      const cuentaRepo = managerTx.getRepository(CuentaPorPagar);
      const cuenta = await cuentaRepo.findOne({
        where: { publicId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!cuenta) {
        throw new BadRequestException(
          `La cuenta por pagar ${publicId} no existe`,
        );
      }
      if (cuenta.estatus === 'cancelada') {
        throw new BadRequestException('La cuenta ya está cancelada');
      }

      await this.cancelarCuentaEnTransaccion(managerTx, cuenta, usuarioId);
      return { msg: 'Cuenta por pagar cancelada exitosamente' };
    };

    if (manager) return ejecutar(manager);
    return this.dataSource.transaction(ejecutar);
  }

  async cancelarPorCompra(
    compraId: number,
    usuarioId: number,
    manager?: EntityManager,
  ) {
    const ejecutar = async (managerTx: EntityManager) => {
      const cuentaRepo = managerTx.getRepository(CuentaPorPagar);
      const cuenta = await cuentaRepo.findOne({
        where: { compraId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!cuenta || cuenta.estatus === 'cancelada') return;

      await this.cancelarCuentaEnTransaccion(managerTx, cuenta, usuarioId);
    };

    if (manager) return ejecutar(manager);
    return this.dataSource.transaction(ejecutar);
  }

  /**
   * Cancela la CxP y genera el reverso de la compra, reembolsando los pagos
   * ya aplicados.
   */
  private async cancelarCuentaEnTransaccion(
    manager: EntityManager,
    cuenta: CuentaPorPagar,
    usuarioId: number,
  ) {
    const total = this.redondear2(Number(cuenta.monto));
    const reembolsos = await this.reembolsosPagos(manager, cuenta.id);
    const pagado = this.redondear2(
      reembolsos.reduce((suma, item) => suma + item.monto, 0),
    );
    const compra = cuenta.compraId
      ? await manager.getRepository(Compra).findOne({
          where: { id: cuenta.compraId },
        })
      : null;
    const totalReverso = this.redondear2(Number(compra?.total ?? total));
    const iva = this.redondear2(Number(compra?.iva ?? cuenta.iva ?? 0));
    const saldo = this.redondear2(totalReverso - pagado);

    let cuentaCargo = '1105';
    if (cuenta.cuentaContableId) {
      const cuentaContable = await manager
        .getRepository(CuentaContable)
        .findOne({ where: { id: cuenta.cuentaContableId } });
      if (cuentaContable) cuentaCargo = cuentaContable.codigo;
    }

    const poliza =
      await this.integracionContableService.registrarCancelacionCompra(
        compra?.folio ?? cuenta.folio,
        totalReverso,
        iva,
        saldo,
        reembolsos,
        usuarioId,
        manager,
        cuentaCargo,
        compra ? 'compra' : 'cuenta por pagar',
        compra?.centroCostoId,
      );

    await manager.getRepository(CuentaPorPagar).update(cuenta.id, {
      estatus: 'cancelada',
      saldo: 0,
      polizaCancelacionId: poliza.id,
      fechaActualizacion: new Date(),
    });
  }

  /**
   * Agrupa los pagos por la cuenta contable de la que salió el efectivo.
   * Si el pago no tiene póliza (datos históricos), usa el mapeo del método.
   */
  private async reembolsosPagos(
    manager: EntityManager,
    cuentaId: number,
  ): Promise<Array<{ codigo: string; monto: number }>> {
    const pagos = await manager.getRepository(PagoCxP).find({
      where: { cuentaPorPagarId: cuentaId },
    });
    if (!pagos.length) return [];

    const polizaIds = pagos
      .map((pago) => pago.polizaId)
      .filter((id): id is number => !!id);
    const detalles = polizaIds.length
      ? await manager.getRepository(PolizaDetalle).find({
          where: { polizaId: In(polizaIds), haber: MoreThan(0) },
          relations: { cuenta: true },
          order: { id: 'ASC' },
        })
      : [];

    const cuentaPorPoliza = new Map<number, string>();
    for (const detalle of detalles) {
      if (!detalle.cuenta || detalle.cuenta.codigo === '2101') continue;
      if (!cuentaPorPoliza.has(detalle.polizaId)) {
        cuentaPorPoliza.set(detalle.polizaId, detalle.cuenta.codigo);
      }
    }

    const acumulado = new Map<string, number>();
    for (const pago of pagos) {
      const codigo =
        (pago.polizaId ? cuentaPorPoliza.get(pago.polizaId) : undefined) ??
        cuentaPagoPorMetodo(pago.metodoPago);
      const monto = this.redondear2(Number(pago.monto));
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
