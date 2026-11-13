import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Between, DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { CuentaBancaria } from './entities/cuenta-bancaria.entity';
import { MovimientoBancario } from './entities/movimiento-bancario.entity';
import { CuentasService } from './cuentas.service';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';
import { CreateMovimientoBancarioDto } from './dto/create-movimiento-bancario.dto';
import { ConciliarMovimientoDto } from './dto/conciliar-movimiento.dto';
import { ConciliarAutomaticoDto } from './dto/conciliar-automatico.dto';
import {
  ConciliacionQueryDto,
  MovimientosBancariosQueryDto,
} from './dto/movimientos-bancarios.query.dto';
import { PolizaDetalle } from './entities/poliza-detalle.entity';
import { ConciliacionBancaria } from './entities/conciliacion-bancaria.entity';
import { ConciliarMovimientoMultipleDto } from './dto/conciliar-movimiento-multiple.dto';
import {
  detectarFormato,
  FormatoEstadoCuenta,
  MovimientoImportado,
  parsearEstadoCuenta,
} from './helpers/estados-cuenta.parser';

interface FilaPartidaContable {
  public_id: string;
  poliza_public_id: string;
  fecha: Date | string;
  folio: string;
  concepto: string;
  detalle_concepto: string | null;
  referencia: string | null;
  debe: string | number;
  haber: string | number;
}

interface FilaSaldoContable {
  saldo: string | number;
}

interface FilaSaldoBanco {
  cargos: string | number;
  abonos: string | number;
}

interface FilaDetalleConciliable {
  id: number;
  public_id: string;
  debe: string | number;
  haber: string | number;
  fecha: Date | string;
  referencia: string | null;
  concepto: string | null;
  poliza_concepto: string;
  folio: string;
}

interface FilaReglaConciliacion {
  id: number;
  nombre: string;
  tipo_movimiento: string;
  referencia_contiene: string | null;
  descripcion_contiene: string | null;
  tolerancia_monto: string | number;
  tolerancia_dias: number;
}

@Injectable()
export class BancosService {
  constructor(
    @InjectRepository(CuentaBancaria)
    private readonly cuentaRepository: Repository<CuentaBancaria>,
    @InjectRepository(MovimientoBancario)
    private readonly movimientoRepository: Repository<MovimientoBancario>,
    private readonly dataSource: DataSource,
    private readonly cuentasService: CuentasService,
  ) {}

  async crear(dto: CreateCuentaBancariaDto, usuarioId: number) {
    const cuentaContable = await this.resolverCuentaContable(
      dto.cuentaContableId,
    );

    const guardada = await this.cuentaRepository.save(
      this.cuentaRepository.create({
        nombre: dto.nombre,
        banco: dto.banco,
        numeroCuenta: dto.numeroCuenta ?? null,
        clabe: dto.clabe ?? null,
        moneda: dto.moneda ?? 'MXN',
        saldoInicial: this.redondear2(dto.saldoInicial ?? 0),
        cuentaContableId: cuentaContable.id,
        activo: dto.activo ?? true,
        usuarioId,
      }),
    );

    return this.buscarPorId(guardada.publicId);
  }

  async buscar() {
    return this.cuentaRepository.find({
      relations: { cuentaContable: true },
      order: { id: 'DESC' },
    });
  }

  async buscarPorId(publicId: string) {
    const cuenta = await this.cuentaRepository.findOne({
      where: { publicId },
      relations: { cuentaContable: true },
    });
    if (!cuenta) {
      throw new BadRequestException(`La cuenta bancaria ${publicId} no existe`);
    }
    return cuenta;
  }

  async actualizar(publicId: string, dto: UpdateCuentaBancariaDto) {
    const cuenta = await this.buscarPorId(publicId);
    let cuentaContableId = cuenta.cuentaContableId;
    if (dto.cuentaContableId) {
      const cuentaContable = await this.resolverCuentaContable(
        dto.cuentaContableId,
      );
      cuentaContableId = cuentaContable.id;
    }

    await this.cuentaRepository.update(cuenta.id, {
      nombre: dto.nombre ?? cuenta.nombre,
      banco: dto.banco ?? cuenta.banco,
      numeroCuenta:
        dto.numeroCuenta !== undefined
          ? (dto.numeroCuenta ?? null)
          : cuenta.numeroCuenta,
      clabe: dto.clabe !== undefined ? (dto.clabe ?? null) : cuenta.clabe,
      moneda: dto.moneda ?? cuenta.moneda,
      saldoInicial:
        dto.saldoInicial !== undefined
          ? this.redondear2(dto.saldoInicial)
          : cuenta.saldoInicial,
      cuentaContableId,
      activo: dto.activo ?? cuenta.activo,
      fechaActualizacion: new Date(),
    });

    return { msg: 'Cuenta bancaria actualizada exitosamente' };
  }

  async activarDesactivar(publicId: string) {
    const cuenta = await this.buscarPorId(publicId);
    await this.cuentaRepository.update(cuenta.id, {
      activo: !cuenta.activo,
      fechaActualizacion: new Date(),
    });
    return {
      msg: `Cuenta bancaria ${!cuenta.activo ? 'activada' : 'desactivada'} correctamente`,
    };
  }

  async crearMovimiento(
    publicId: string,
    dto: CreateMovimientoBancarioDto,
    usuarioId: number,
  ) {
    const cuenta = await this.buscarPorId(publicId);
    const cargo = this.redondear2(dto.cargo ?? 0);
    const abono = this.redondear2(dto.abono ?? 0);

    if (cargo < 0 || abono < 0) {
      throw new BadRequestException('Cargo y abono no pueden ser negativos');
    }
    if ((cargo > 0 && abono > 0) || (cargo === 0 && abono === 0)) {
      throw new BadRequestException(
        'El movimiento debe tener cargo o abono, pero no ambos',
      );
    }

    const movimiento = await this.movimientoRepository.save(
      this.movimientoRepository.create({
        cuentaBancariaId: cuenta.id,
        fecha: dto.fecha,
        descripcion: dto.descripcion,
        referencia: dto.referencia ?? null,
        cargo,
        abono,
        saldo: dto.saldo !== undefined ? this.redondear2(dto.saldo) : null,
        polizaDetalleId: null,
        conciliadoEn: null,
        hashImportacion: null,
        usuarioId,
      }),
    );

    return this.buscarMovimiento(movimiento.publicId);
  }

  async importarMovimientos(
    publicId: string,
    archivo: Buffer,
    nombreArchivo: string | undefined,
    formatoSolicitado: 'auto' | FormatoEstadoCuenta,
    usuarioId: number,
  ) {
    const cuenta = await this.buscarPorId(publicId);
    const contenido = archivo.toString('utf8').replace(/^\uFEFF/, '');
    const formato =
      formatoSolicitado === 'auto'
        ? detectarFormato(nombreArchivo, contenido)
        : formatoSolicitado;

    const { movimientos, errores } = parsearEstadoCuenta(archivo, formato);
    if (!movimientos.length) {
      const detalle = errores
        .slice(0, 3)
        .map((error) => `fila ${error.fila}: ${error.mensaje}`)
        .join('; ');
      throw new BadRequestException(
        `No se pudo importar ninguna fila${detalle ? ` (${detalle})` : ''}`,
      );
    }

    const hashes = movimientos.map((movimiento) =>
      this.hashMovimiento(movimiento),
    );
    const existentes = await this.movimientoRepository.find({
      where: {
        cuentaBancariaId: cuenta.id,
        hashImportacion: In(hashes),
      },
      select: { hashImportacion: true },
    });
    const vistos = new Set(
      existentes
        .map((movimiento) => movimiento.hashImportacion)
        .filter((hash): hash is string => !!hash),
    );

    const nuevos: Array<MovimientoImportado & { hash: string }> = [];
    let duplicados = 0;
    movimientos.forEach((movimiento, indice) => {
      const hash = hashes[indice];
      if (vistos.has(hash)) {
        duplicados += 1;
        return;
      }
      vistos.add(hash);
      nuevos.push({ ...movimiento, hash });
    });

    let guardados: MovimientoBancario[] = [];
    if (nuevos.length) {
      guardados = await this.dataSource.transaction(async (manager) => {
        const repositorio = manager.getRepository(MovimientoBancario);
        const entidades = nuevos.map((movimiento) =>
          repositorio.create({
            cuentaBancariaId: cuenta.id,
            fecha: movimiento.fecha,
            descripcion: movimiento.descripcion,
            referencia: movimiento.referencia,
            cargo: movimiento.cargo,
            abono: movimiento.abono,
            saldo: movimiento.saldo,
            polizaDetalleId: null,
            conciliadoEn: null,
            hashImportacion: movimiento.hash,
            usuarioId,
          }),
        );
        return repositorio.save(entidades);
      });
    }

    return {
      cuentaBancaria: {
        publicId: cuenta.publicId,
        nombre: cuenta.nombre,
      },
      formato,
      archivo: nombreArchivo ?? null,
      totalFilas: movimientos.length + errores.length,
      importados: guardados.length,
      duplicados,
      errores,
      movimientos: guardados.map((movimiento) => this.toMovimiento(movimiento)),
    };
  }

  async listarMovimientos(
    publicId: string,
    query: MovimientosBancariosQueryDto,
  ) {
    const cuenta = await this.buscarPorId(publicId);
    const where: Record<string, unknown> = {
      cuentaBancariaId: cuenta.id,
    };
    if (query.desde && query.hasta) {
      where.fecha = Between(query.desde, query.hasta);
    } else if (query.desde) {
      where.fecha = Between(query.desde, '9999-12-31');
    } else if (query.hasta) {
      where.fecha = Between('1900-01-01', query.hasta);
    }
    if (query.conciliado !== undefined) {
      where.polizaDetalleId = query.conciliado ? Not(IsNull()) : IsNull();
    }

    const movimientos = await this.movimientoRepository.find({
      where,
      relations: {
        polizaDetalle: { poliza: true },
        conciliaciones: { polizaDetalle: { poliza: true } },
      },
      order: { fecha: 'ASC', id: 'ASC' },
    });
    return movimientos.map((movimiento) => this.toMovimiento(movimiento));
  }

  async conciliacion(publicId: string, query: ConciliacionQueryDto) {
    const cuenta = await this.buscarPorId(publicId);
    const rango = this.resolverRango(query);

    const [saldoContableFila] = await this.consultar<FilaSaldoContable>(
      `SELECT COALESCE(SUM(d.debe - d.haber), 0) AS saldo
         FROM polizas_detalles d
         INNER JOIN polizas p ON p.id = d.poliza_id
        WHERE d.cuenta_id = $1
          AND p.estatus = 'contabilizada'
          AND p.fecha <= $2`,
      [cuenta.cuentaContableId, rango.hasta],
    );

    const [saldoBancoFila] = await this.consultar<FilaSaldoBanco>(
      `SELECT COALESCE(SUM(cargo), 0) AS cargos,
              COALESCE(SUM(abono), 0) AS abonos
         FROM movimientos_bancarios
        WHERE cuenta_bancaria_id = $1
          AND fecha <= $2`,
      [cuenta.id, rango.hasta],
    );

    const partidas = await this.consultar<FilaPartidaContable>(
      `SELECT d.public_id, p.public_id AS poliza_public_id, p.fecha, p.folio,
              p.concepto, d.concepto AS detalle_concepto, d.referencia,
              d.debe, d.haber
         FROM polizas_detalles d
         INNER JOIN polizas p ON p.id = d.poliza_id
         LEFT JOIN conciliaciones_bancarias cb ON cb.poliza_detalle_id = d.id
        WHERE d.cuenta_id = $1
          AND p.estatus = 'contabilizada'
          AND p.fecha BETWEEN $2 AND $3
          AND cb.id IS NULL
        ORDER BY p.fecha ASC, p.id ASC, d.orden ASC`,
      [cuenta.cuentaContableId, rango.desde, rango.hasta],
    );

    const movimientos = await this.movimientoRepository.find({
      where: {
        cuentaBancariaId: cuenta.id,
        fecha: Between(rango.desde, rango.hasta),
      },
      relations: {
        polizaDetalle: { poliza: true },
        conciliaciones: { polizaDetalle: { poliza: true } },
      },
      order: { fecha: 'ASC', id: 'ASC' },
    });

    const saldoContable = this.redondear2(saldoContableFila?.saldo);
    const saldoBanco = this.redondear2(
      Number(cuenta.saldoInicial) +
        Number(saldoBancoFila?.cargos ?? 0) -
        Number(saldoBancoFila?.abonos ?? 0),
    );

    return {
      cuentaBancaria: cuenta,
      desde: rango.desde,
      hasta: rango.hasta,
      saldoContable,
      saldoBanco,
      diferencia: this.redondear2(saldoContable - saldoBanco),
      partidasContables: partidas.map((partida) => ({
        publicId: partida.public_id,
        polizaId: partida.poliza_public_id,
        fecha: this.fechaString(partida.fecha),
        folio: partida.folio,
        concepto: partida.detalle_concepto || partida.concepto,
        referencia: partida.referencia ?? null,
        debe: this.redondear2(partida.debe),
        haber: this.redondear2(partida.haber),
        tipo: Number(partida.debe) > 0 ? 'cargo' : 'abono',
        importe: this.redondear2(
          Number(partida.debe) > 0 ? partida.debe : partida.haber,
        ),
      })),
      movimientosBanco: movimientos.map((movimiento) =>
        this.toMovimiento(movimiento),
      ),
    };
  }

  async conciliar(
    publicId: string,
    movimientoPublicId: string,
    dto: ConciliarMovimientoDto,
    usuarioId: number,
  ) {
    const cuenta = await this.buscarPorId(publicId);
    const movimiento = await this.buscarMovimientoParaCuenta(
      movimientoPublicId,
      cuenta.id,
    );
    if (movimiento.polizaDetalleId) {
      throw new BadRequestException('El movimiento ya está conciliado');
    }

    const detalle = await this.dataSource.getRepository(PolizaDetalle).findOne({
      where: { publicId: dto.polizaDetalleId },
      relations: { poliza: true },
    });
    if (!detalle) {
      throw new BadRequestException(
        `El detalle de póliza ${dto.polizaDetalleId} no existe`,
      );
    }
    if (detalle.cuentaId !== cuenta.cuentaContableId) {
      throw new BadRequestException(
        'El detalle de póliza no pertenece a la cuenta contable del banco',
      );
    }
    if (detalle.poliza?.estatus !== 'contabilizada') {
      throw new BadRequestException(
        'Solo se pueden conciliar pólizas contabilizadas',
      );
    }

    const yaConciliado = await this.movimientoRepository.findOne({
      where: { polizaDetalleId: detalle.id },
    });
    const enConciliacion = await this.dataSource
      .getRepository(ConciliacionBancaria)
      .findOne({ where: { polizaDetalleId: detalle.id } });
    if (yaConciliado || enConciliacion) {
      throw new BadRequestException(
        'El detalle de póliza ya está conciliado con otro movimiento',
      );
    }

    const montoMovimiento = this.redondear2(
      Number(movimiento.cargo) > 0 ? movimiento.cargo : movimiento.abono,
    );
    const montoDetalle = this.redondear2(
      Number(movimiento.cargo) > 0 ? detalle.debe : detalle.haber,
    );
    if (montoMovimiento !== montoDetalle) {
      throw new BadRequestException(
        `El monto no coincide: banco ${montoMovimiento}, póliza ${montoDetalle}`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const conciliacionRepo = manager.getRepository(ConciliacionBancaria);
      await conciliacionRepo.save(
        conciliacionRepo.create({
          movimientoBancarioId: movimiento.id,
          polizaDetalleId: detalle.id,
          montoAplicado: montoMovimiento,
          usuarioId,
        }),
      );
      await manager.getRepository(MovimientoBancario).update(movimiento.id, {
        polizaDetalleId: detalle.id,
        conciliadoEn: new Date(),
        fechaActualizacion: new Date(),
      });
    });

    return this.buscarMovimiento(movimiento.publicId);
  }

  async conciliarMultiple(
    publicId: string,
    movimientoPublicId: string,
    dto: ConciliarMovimientoMultipleDto,
    usuarioId: number,
  ) {
    const cuenta = await this.buscarPorId(publicId);
    const movimiento = await this.buscarMovimientoParaCuenta(
      movimientoPublicId,
      cuenta.id,
    );
    if (movimiento.polizaDetalleId) {
      throw new BadRequestException('El movimiento ya está conciliado');
    }

    const ids = dto.aplicaciones.map(
      (aplicacion) => aplicacion.polizaDetalleId,
    );
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(
        'No se puede repetir el mismo detalle de póliza',
      );
    }

    const montoMovimiento = this.redondear2(
      Number(movimiento.cargo) > 0 ? movimiento.cargo : movimiento.abono,
    );
    const totalAplicado = this.redondear2(
      dto.aplicaciones.reduce(
        (total, aplicacion) => total + this.redondear2(aplicacion.monto),
        0,
      ),
    );
    if (totalAplicado !== montoMovimiento) {
      throw new BadRequestException(
        `La suma de las aplicaciones (${totalAplicado}) no coincide con el movimiento (${montoMovimiento})`,
      );
    }

    const detalles = await this.dataSource.getRepository(PolizaDetalle).find({
      where: { publicId: In(ids) },
      relations: { poliza: true },
    });
    if (detalles.length !== ids.length) {
      throw new BadRequestException('Uno o más detalles de póliza no existen');
    }

    const mapa = new Map(
      detalles.map((detalle) => [detalle.publicId, detalle]),
    );
    for (const aplicacion of dto.aplicaciones) {
      const detalle = mapa.get(aplicacion.polizaDetalleId);
      if (!detalle) {
        throw new BadRequestException(
          `El detalle ${aplicacion.polizaDetalleId} no existe`,
        );
      }
      if (detalle.cuentaId !== cuenta.cuentaContableId) {
        throw new BadRequestException(
          'Todos los detalles deben pertenecer a la cuenta contable del banco',
        );
      }
      if (detalle.poliza?.estatus !== 'contabilizada') {
        throw new BadRequestException(
          'Solo se pueden conciliar pólizas contabilizadas',
        );
      }
      const montoDetalle = this.redondear2(
        Number(movimiento.cargo) > 0 ? detalle.debe : detalle.haber,
      );
      if (this.redondear2(aplicacion.monto) !== montoDetalle) {
        throw new BadRequestException(
          `El monto de ${detalle.publicId} no coincide con la póliza (${montoDetalle})`,
        );
      }
    }

    const yaConciliados = await this.dataSource
      .getRepository(ConciliacionBancaria)
      .find({
        where: { polizaDetalleId: In(detalles.map((detalle) => detalle.id)) },
      });
    if (yaConciliados.length) {
      throw new BadRequestException(
        'Uno o más detalles de póliza ya están conciliados',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const conciliacionRepo = manager.getRepository(ConciliacionBancaria);
      const entidades = dto.aplicaciones.map((aplicacion) => {
        const detalle = mapa.get(aplicacion.polizaDetalleId);
        return conciliacionRepo.create({
          movimientoBancarioId: movimiento.id,
          polizaDetalleId: detalle?.id,
          montoAplicado: this.redondear2(aplicacion.monto),
          usuarioId,
        });
      });
      await conciliacionRepo.save(entidades);
      await manager.getRepository(MovimientoBancario).update(movimiento.id, {
        polizaDetalleId: detalles[0].id,
        conciliadoEn: new Date(),
        fechaActualizacion: new Date(),
      });
    });

    return this.buscarMovimiento(movimiento.publicId);
  }

  async desconciliar(publicId: string, movimientoPublicId: string) {
    const cuenta = await this.buscarPorId(publicId);
    const movimiento = await this.buscarMovimientoParaCuenta(
      movimientoPublicId,
      cuenta.id,
    );
    const conciliaciones = await this.dataSource
      .getRepository(ConciliacionBancaria)
      .count({ where: { movimientoBancarioId: movimiento.id } });
    if (!movimiento.polizaDetalleId && conciliaciones === 0) {
      throw new BadRequestException('El movimiento no está conciliado');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(ConciliacionBancaria)
        .delete({ movimientoBancarioId: movimiento.id });
      await manager.getRepository(MovimientoBancario).update(movimiento.id, {
        polizaDetalleId: null,
        conciliadoEn: null,
        fechaActualizacion: new Date(),
      });
    });

    return { msg: 'Movimiento desconciliado exitosamente' };
  }

  async conciliarAutomatico(
    publicId: string,
    dto: ConciliarAutomaticoDto,
    usuarioId: number,
  ) {
    const cuenta = await this.buscarPorId(publicId);
    const rango = this.resolverRango(dto);
    const toleranciaDefault = dto.toleranciaDias ?? 3;

    const reglas = await this.consultar<FilaReglaConciliacion>(
      `SELECT id, nombre, tipo_movimiento, referencia_contiene,
              descripcion_contiene, tolerancia_monto, tolerancia_dias
         FROM reglas_conciliacion_bancaria
        WHERE activo = true
          AND (cuenta_bancaria_id = $1 OR cuenta_bancaria_id IS NULL)
        ORDER BY prioridad ASC, id ASC`,
      [cuenta.id],
    );

    const reglasAplicables: FilaReglaConciliacion[] = [
      ...reglas,
      {
        id: 0,
        nombre: 'Predeterminada',
        tipo_movimiento: 'ambos',
        referencia_contiene: null,
        descripcion_contiene: null,
        tolerancia_monto: 0,
        tolerancia_dias: toleranciaDefault,
      },
    ];

    const movimientos = await this.movimientoRepository.find({
      where: {
        cuentaBancariaId: cuenta.id,
        fecha: Between(rango.desde, rango.hasta),
        polizaDetalleId: IsNull(),
      },
      order: { fecha: 'ASC', id: 'ASC' },
    });

    const toleranciaMaxima = Math.max(
      toleranciaDefault,
      ...reglasAplicables.map((regla) => Number(regla.tolerancia_dias) || 0),
    );
    const desdeDetalle = this.sumarDias(rango.desde, -toleranciaMaxima);
    const hastaDetalle = this.sumarDias(rango.hasta, toleranciaMaxima);
    const detalles = await this.consultar<FilaDetalleConciliable>(
      `SELECT d.id, d.public_id, d.debe, d.haber, p.fecha,
              d.referencia, d.concepto, p.concepto AS poliza_concepto, p.folio
         FROM polizas_detalles d
         INNER JOIN polizas p ON p.id = d.poliza_id
         LEFT JOIN conciliaciones_bancarias cb ON cb.poliza_detalle_id = d.id
        WHERE d.cuenta_id = $1
          AND p.estatus = 'contabilizada'
          AND p.fecha BETWEEN $2 AND $3
          AND cb.id IS NULL
        ORDER BY p.fecha ASC, d.id ASC`,
      [cuenta.cuentaContableId, desdeDetalle, hastaDetalle],
    );

    const usados = new Set<number>();
    const conciliados: Array<{
      movimientoId: string;
      polizaDetalleId: string;
      fechaMovimiento: string;
      fechaPoliza: string;
      monto: number;
      reglaId: number | null;
      reglaNombre: string;
    }> = [];

    const asignaciones: Array<{
      movimiento: MovimientoBancario;
      detalle: FilaDetalleConciliable;
      montoAplicado: number;
    }> = [];

    for (const movimiento of movimientos) {
      const esCargo = Number(movimiento.cargo) > 0;
      const montoMovimiento = this.redondear2(
        esCargo ? movimiento.cargo : movimiento.abono,
      );
      const fechaMovimiento = this.fechaString(movimiento.fecha);
      const textoBanco =
        `${movimiento.referencia ?? ''} ${movimiento.descripcion}`.toLowerCase();

      let seleccion:
        | { detalle: FilaDetalleConciliable; regla: FilaReglaConciliacion }
        | undefined;

      for (const regla of reglasAplicables) {
        if (regla.tipo_movimiento === 'cargo' && !esCargo) continue;
        if (regla.tipo_movimiento === 'abono' && esCargo) continue;

        const toleranciaMonto = this.redondear2(
          Number(regla.tolerancia_monto) || 0,
        );
        const toleranciaDias = Number(regla.tolerancia_dias) || 0;
        const candidatos = detalles.filter((detalle) => {
          if (usados.has(detalle.id)) return false;
          const montoDetalle = this.redondear2(
            esCargo ? detalle.debe : detalle.haber,
          );
          if (Math.abs(montoDetalle - montoMovimiento) > toleranciaMonto) {
            return false;
          }
          const dias = Math.abs(
            this.diferenciaDias(
              fechaMovimiento,
              this.fechaString(detalle.fecha),
            ),
          );
          if (dias > toleranciaDias) return false;
          return this.cumpleRegla(regla, textoBanco, detalle);
        });

        if (!candidatos.length) continue;

        candidatos.sort((a, b) => {
          const montoA = this.redondear2(esCargo ? a.debe : a.haber);
          const montoB = this.redondear2(esCargo ? b.debe : b.haber);
          const diffMonto =
            Math.abs(montoA - montoMovimiento) -
            Math.abs(montoB - montoMovimiento);
          if (diffMonto !== 0) return diffMonto;
          const diffDias =
            Math.abs(
              this.diferenciaDias(fechaMovimiento, this.fechaString(a.fecha)),
            ) -
            Math.abs(
              this.diferenciaDias(fechaMovimiento, this.fechaString(b.fecha)),
            );
          return diffDias || a.id - b.id;
        });

        seleccion = { detalle: candidatos[0], regla };
        break;
      }

      if (!seleccion) continue;
      usados.add(seleccion.detalle.id);
      const montoAplicado = this.redondear2(
        esCargo ? seleccion.detalle.debe : seleccion.detalle.haber,
      );
      asignaciones.push({
        movimiento,
        detalle: seleccion.detalle,
        montoAplicado,
      });
      conciliados.push({
        movimientoId: movimiento.publicId,
        polizaDetalleId: seleccion.detalle.public_id,
        fechaMovimiento,
        fechaPoliza: this.fechaString(seleccion.detalle.fecha),
        monto: montoAplicado,
        reglaId: seleccion.regla.id || null,
        reglaNombre: seleccion.regla.nombre,
      });
    }

    if (asignaciones.length) {
      await this.dataSource.transaction(async (manager) => {
        const movimientoRepo = manager.getRepository(MovimientoBancario);
        const conciliacionRepo = manager.getRepository(ConciliacionBancaria);
        for (const asignacion of asignaciones) {
          await conciliacionRepo.save(
            conciliacionRepo.create({
              movimientoBancarioId: asignacion.movimiento.id,
              polizaDetalleId: asignacion.detalle.id,
              montoAplicado: asignacion.montoAplicado,
              usuarioId,
            }),
          );
          await movimientoRepo.update(asignacion.movimiento.id, {
            polizaDetalleId: asignacion.detalle.id,
            conciliadoEn: new Date(),
            fechaActualizacion: new Date(),
          });
        }
      });
    }

    return {
      desde: rango.desde,
      hasta: rango.hasta,
      toleranciaDias: toleranciaDefault,
      reglasAplicadas: reglas.length,
      conciliados,
      sinConciliar: movimientos.length - conciliados.length,
    };
  }

  private cumpleRegla(
    regla: FilaReglaConciliacion,
    textoBanco: string,
    detalle: FilaDetalleConciliable,
  ) {
    const textoPoliza = [
      detalle.referencia ?? '',
      detalle.concepto ?? '',
      detalle.poliza_concepto,
      detalle.folio,
    ]
      .join(' ')
      .toLowerCase();

    const contiene = (condicion: string | null) => {
      if (!condicion) return true;
      const texto = condicion.trim().toLowerCase();
      if (!texto) return true;
      return textoBanco.includes(texto) || textoPoliza.includes(texto);
    };

    return (
      contiene(regla.referencia_contiene) &&
      contiene(regla.descripcion_contiene)
    );
  }

  private hashMovimiento(movimiento: MovimientoImportado) {
    return createHash('sha256')
      .update(
        [
          movimiento.fecha,
          movimiento.descripcion.trim().toLowerCase(),
          (movimiento.referencia ?? '').trim().toLowerCase(),
          movimiento.cargo.toFixed(2),
          movimiento.abono.toFixed(2),
          movimiento.saldo === null ? '' : movimiento.saldo.toFixed(2),
        ].join('|'),
      )
      .digest('hex');
  }

  private async buscarMovimiento(publicId: string) {
    const movimiento = await this.movimientoRepository.findOne({
      where: { publicId },
      relations: {
        polizaDetalle: { poliza: true },
        conciliaciones: { polizaDetalle: { poliza: true } },
      },
    });
    if (!movimiento) {
      throw new BadRequestException(`El movimiento ${publicId} no existe`);
    }
    return this.toMovimiento(movimiento);
  }

  private async buscarMovimientoParaCuenta(
    publicId: string,
    cuentaBancariaId: number,
  ) {
    const movimiento = await this.movimientoRepository.findOne({
      where: { publicId, cuentaBancariaId },
    });
    if (!movimiento) {
      throw new BadRequestException(
        `El movimiento ${publicId} no existe en esta cuenta bancaria`,
      );
    }
    return movimiento;
  }

  private toMovimiento(movimiento: MovimientoBancario) {
    const conciliaciones = (movimiento.conciliaciones ?? []).map(
      (conciliacion) => ({
        publicId: conciliacion.publicId,
        polizaDetalleId: conciliacion.polizaDetalle?.publicId ?? null,
        polizaFolio: conciliacion.polizaDetalle?.poliza?.folio ?? null,
        monto: this.redondear2(conciliacion.montoAplicado),
      }),
    );

    return {
      publicId: movimiento.publicId,
      fecha: this.fechaString(movimiento.fecha),
      descripcion: movimiento.descripcion,
      referencia: movimiento.referencia,
      cargo: this.redondear2(movimiento.cargo),
      abono: this.redondear2(movimiento.abono),
      saldo:
        movimiento.saldo !== null ? this.redondear2(movimiento.saldo) : null,
      conciliado: conciliaciones.length > 0 || !!movimiento.polizaDetalleId,
      polizaFolio:
        conciliaciones[0]?.polizaFolio ??
        movimiento.polizaDetalle?.poliza?.folio ??
        null,
      conciliaciones,
      conciliadoEn: movimiento.conciliadoEn,
    };
  }

  private async resolverCuentaContable(cuentaContableId?: string) {
    const cuentaContable = cuentaContableId
      ? await this.cuentasService.buscarPorId(cuentaContableId)
      : await this.cuentasService.buscarPorCodigo('1102');
    if (
      cuentaContable.tipo !== 'activo' ||
      !cuentaContable.activo ||
      !cuentaContable.permiteMovimientos
    ) {
      throw new BadRequestException(
        `La cuenta ${cuentaContable.codigo} no es una cuenta bancaria válida`,
      );
    }
    return cuentaContable;
  }

  private resolverRango(query: { desde?: string; hasta?: string }) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth() + 1;
    const ultimoDia = new Date(anio, mes, 0).getDate();
    const desde = query.desde ?? `${anio}-${String(mes).padStart(2, '0')}-01`;
    const hasta =
      query.hasta ??
      `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
    if (desde > hasta) {
      throw new BadRequestException(
        'El rango de fechas es inválido: "desde" debe ser anterior a "hasta"',
      );
    }
    return { desde, hasta };
  }

  private async consultar<T>(sql: string, params: unknown[]): Promise<T[]> {
    return this.dataSource.query(sql, params);
  }

  private fechaString(fecha: Date | string) {
    if (typeof fecha === 'string') return fecha.slice(0, 10);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private sumarDias(fecha: string, dias: number) {
    const valor = new Date(`${fecha}T00:00:00.000Z`);
    valor.setUTCDate(valor.getUTCDate() + dias);
    return valor.toISOString().slice(0, 10);
  }

  private diferenciaDias(desde: string, hasta: string) {
    const inicio = new Date(`${desde}T00:00:00.000Z`).getTime();
    const fin = new Date(`${hasta}T00:00:00.000Z`).getTime();
    return Math.floor((fin - inicio) / 86400000);
  }

  private redondear2(valor: string | number | null | undefined) {
    return Math.round((Number(valor) || 0) * 100) / 100;
  }
}
