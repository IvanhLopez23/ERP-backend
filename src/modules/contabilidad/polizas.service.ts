import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, ILike, In, Repository } from 'typeorm';
import { CuentaContable } from './entities/cuenta-contable.entity';
import { Poliza } from './entities/poliza.entity';
import { PolizaDetalle } from './entities/poliza-detalle.entity';
import { CreatePolizaDto } from './dto/create-poliza.dto';
import { CreatePolizaDetalleDto } from './dto/create-poliza-detalle.dto';
import { UpdatePolizaDto } from './dto/update-poliza.dto';
import { PaginarPolizasDto } from './dto/paginar-polizas.dto';
import { PeriodosService } from './periodos.service';
import { FoliosService } from './folios.service';
import { CentroCosto } from './entities/centro-costo.entity';

interface DetalleResuelto {
  cuentaId: number;
  concepto: string | null;
  debe: number;
  haber: number;
  referencia: string | null;
  orden: number;
  centroCostoId: number | null;
}

@Injectable()
export class PolizasService {
  constructor(
    @InjectRepository(Poliza)
    private readonly polizaRepository: Repository<Poliza>,
    @InjectRepository(PolizaDetalle)
    private readonly detalleRepository: Repository<PolizaDetalle>,
    private readonly dataSource: DataSource,
    private readonly periodosService: PeriodosService,
    private readonly foliosService: FoliosService,
  ) {}

  async crear(
    dto: CreatePolizaDto,
    usuarioId: number,
    manager?: EntityManager,
    centroCostoInternoId?: number | null,
    centrosDetalleInternos?: Array<number | null>,
  ) {
    if (manager) {
      return this.crearEnTransaccion(
        manager,
        dto,
        usuarioId,
        centroCostoInternoId,
        centrosDetalleInternos,
      );
    }

    const polizaId = await this.dataSource.transaction(async (managerTx) => {
      const poliza = await this.crearEnTransaccion(
        managerTx,
        dto,
        usuarioId,
        centroCostoInternoId,
        centrosDetalleInternos,
      );
      return poliza.id;
    });

    return this.buscarPorIdInterno(polizaId);
  }

  private async crearEnTransaccion(
    manager: EntityManager,
    dto: CreatePolizaDto,
    usuarioId: number,
    centroCostoInternoId?: number | null,
    centrosDetalleInternos?: Array<number | null>,
  ) {
    const fecha = dto.fecha;
    const periodo = await this.periodosService.obtenerPeriodoParaFecha(fecha);
    const centroCostoId = await this.resolverCentroCosto(
      manager,
      dto.centroCostoId,
      centroCostoInternoId,
    );

    const { detalles, totalDebe, totalHaber } = await this.resolverDetalles(
      dto.detalles,
      manager,
      centroCostoId,
      centrosDetalleInternos,
    );
    const polizaRepo = manager.getRepository(Poliza);
    const secuencial = await this.foliosService.siguiente(
      'poliza',
      { anio: periodo.anio, mes: periodo.mes },
      manager,
    );

    const poliza = polizaRepo.create({
      folio: this.generarFolio(periodo.anio, periodo.mes, secuencial),
      fecha,
      tipo: dto.tipo,
      concepto: dto.concepto,
      estatus: 'borrador',
      periodoId: periodo.id,
      usuarioId,
      totalDebe,
      totalHaber,
      centroCostoId,
    });
    const guardada = await polizaRepo.save(poliza);

    const detalleRepo = manager.getRepository(PolizaDetalle);
    await detalleRepo.save(
      detalles.map((detalle) =>
        detalleRepo.create({ ...detalle, polizaId: guardada.id }),
      ),
    );

    return guardada;
  }

  async buscar() {
    return this.polizaRepository.find({
      relations: { periodo: true, usuario: true, centroCosto: true },
      order: { fecha: 'DESC', id: 'DESC' },
    });
  }

  async paginar(query: PaginarPolizasDto) {
    const { estatus, tipo, periodoId, ...paginacion } = query;
    const { registros = 10, pagina = 1, buscar } = paginacion;
    const where: any = {};

    if (estatus) where.estatus = estatus;
    if (tipo) where.tipo = tipo;
    if (periodoId) {
      const periodo = await this.periodosService.buscarPorId(periodoId);
      where.periodoId = periodo.id;
    }
    if (buscar) where.folio = ILike(`%${buscar}%`);

    const [data, total] = await this.polizaRepository.findAndCount({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: { periodo: true, usuario: true, centroCosto: true },
      order: { fecha: 'DESC', id: 'DESC' },
    });
    return { total, data };
  }

  async buscarPorId(publicId: string) {
    const item = await this.polizaRepository.findOne({
      where: { publicId },
      relations: {
        periodo: true,
        usuario: true,
        centroCosto: true,
        detalles: {
          cuenta: true,
          centroCosto: true,
        },
      },
    });
    if (!item) {
      throw new BadRequestException(`La póliza ${publicId} no existe`);
    }
    item.detalles?.sort((a, b) => a.orden - b.orden);
    return item;
  }

  async actualizar(publicId: string, dto: UpdatePolizaDto, usuarioId: number) {
    const poliza = await this.polizaRepository.findOne({
      where: { publicId },
      relations: { detalles: true },
    });
    if (!poliza) {
      throw new BadRequestException(`La póliza ${publicId} no existe`);
    }
    if (poliza.estatus !== 'borrador') {
      throw new BadRequestException(
        'Solo se pueden editar pólizas en borrador',
      );
    }

    const fecha = dto.fecha ?? poliza.fecha;
    const periodo = dto.fecha
      ? await this.periodosService.obtenerPeriodoParaFecha(fecha)
      : await this.periodosService.buscarPorIdInterno(poliza.periodoId);

    await this.dataSource.transaction(async (manager) => {
      let totalDebe = Number(poliza.totalDebe);
      let totalHaber = Number(poliza.totalHaber);
      let centroCostoId = poliza.centroCostoId;
      if (dto.centroCostoId !== undefined) {
        centroCostoId = await this.resolverCentroCosto(
          manager,
          dto.centroCostoId,
        );
      }

      if (dto.detalles !== undefined) {
        const resuelto = await this.resolverDetalles(
          dto.detalles,
          manager,
          centroCostoId,
        );
        totalDebe = resuelto.totalDebe;
        totalHaber = resuelto.totalHaber;

        await manager
          .getRepository(PolizaDetalle)
          .delete({ polizaId: poliza.id });
        const detalleRepo = manager.getRepository(PolizaDetalle);
        await detalleRepo.save(
          resuelto.detalles.map((detalle) =>
            detalleRepo.create({ ...detalle, polizaId: poliza.id }),
          ),
        );
      }

      await manager.getRepository(Poliza).update(poliza.id, {
        fecha,
        tipo: dto.tipo ?? poliza.tipo,
        concepto: dto.concepto ?? poliza.concepto,
        periodoId: periodo.id,
        totalDebe,
        totalHaber,
        centroCostoId,
        usuarioId,
        fechaActualizacion: new Date(),
      });
    });

    return this.buscarPorId(publicId);
  }

  async contabilizar(publicId: string, manager?: EntityManager) {
    const repositorio = manager
      ? manager.getRepository(Poliza)
      : this.polizaRepository;
    const poliza = await repositorio.findOne({
      where: { publicId },
    });
    if (!poliza) {
      throw new BadRequestException(`La póliza ${publicId} no existe`);
    }
    return this.contabilizarEntidad(repositorio, poliza);
  }

  async contabilizarPorId(id: number, manager?: EntityManager) {
    const repositorio = manager
      ? manager.getRepository(Poliza)
      : this.polizaRepository;
    const poliza = await repositorio.findOne({ where: { id } });
    if (!poliza) {
      throw new BadRequestException(`La póliza ${id} no existe`);
    }
    return this.contabilizarEntidad(repositorio, poliza);
  }

  private async contabilizarEntidad(
    repositorio: Repository<Poliza>,
    poliza: Poliza,
  ) {
    if (poliza.estatus !== 'borrador') {
      throw new BadRequestException(
        `La póliza ya está ${poliza.estatus}, no se puede contabilizar`,
      );
    }

    const periodo = await this.periodosService.buscarPorIdInterno(
      poliza.periodoId,
    );
    if (periodo.estatus !== 'abierto') {
      throw new BadRequestException(
        'No se puede contabilizar en un periodo cerrado',
      );
    }

    await repositorio.update(poliza.id, {
      estatus: 'contabilizada',
      fechaActualizacion: new Date(),
    });
    return { msg: 'Póliza contabilizada exitosamente' };
  }

  async cancelarPorId(id: number, manager?: EntityManager) {
    const repositorio = manager
      ? manager.getRepository(Poliza)
      : this.polizaRepository;
    const poliza = await repositorio.findOne({ where: { id } });
    if (!poliza) {
      throw new BadRequestException(`La póliza ${id} no existe`);
    }
    if (poliza.estatus === 'cancelada') return;

    await repositorio.update(id, {
      estatus: 'cancelada',
      fechaActualizacion: new Date(),
    });
  }

  async cancelar(publicId: string, manager?: EntityManager) {
    const repositorio = manager
      ? manager.getRepository(Poliza)
      : this.polizaRepository;
    const poliza = await repositorio.findOne({
      where: { publicId },
    });
    if (!poliza) {
      throw new BadRequestException(`La póliza ${publicId} no existe`);
    }
    if (poliza.estatus === 'cancelada') {
      throw new BadRequestException('La póliza ya está cancelada');
    }

    await repositorio.update(poliza.id, {
      estatus: 'cancelada',
      fechaActualizacion: new Date(),
    });
    return { msg: 'Póliza cancelada exitosamente' };
  }

  private async buscarPorIdInterno(id: number) {
    const item = await this.polizaRepository.findOne({
      where: { id },
      relations: {
        periodo: true,
        usuario: true,
        centroCosto: true,
        detalles: {
          cuenta: true,
          centroCosto: true,
        },
      },
    });
    if (item) item.detalles?.sort((a, b) => a.orden - b.orden);
    return item;
  }

  private async resolverDetalles(
    detalles: CreatePolizaDetalleDto[],
    manager: EntityManager,
    centroCostoPorDefectoId: number | null = null,
    centrosDetalleInternos?: Array<number | null>,
  ) {
    if (!detalles || detalles.length < 2) {
      throw new BadRequestException(
        'La póliza debe tener al menos dos detalles',
      );
    }

    const publicIds = [...new Set(detalles.map((detalle) => detalle.cuentaId))];
    const cuentas = await manager
      .getRepository(CuentaContable)
      .find({ where: { publicId: In(publicIds) } });
    const mapa = new Map(cuentas.map((cuenta) => [cuenta.publicId, cuenta]));

    let totalDebe = 0;
    let totalHaber = 0;
    const resueltos: DetalleResuelto[] = [];

    for (const [index, detalle] of detalles.entries()) {
      const cuenta = mapa.get(detalle.cuentaId);
      if (!cuenta) {
        throw new BadRequestException(
          `La cuenta contable ${detalle.cuentaId} no existe`,
        );
      }
      if (!cuenta.activo) {
        throw new BadRequestException(
          `La cuenta ${cuenta.codigo} está inactiva`,
        );
      }
      if (!cuenta.permiteMovimientos) {
        throw new BadRequestException(
          `La cuenta ${cuenta.codigo} no permite movimientos`,
        );
      }

      const debe = this.redondear2(Number(detalle.debe ?? 0));
      const haber = this.redondear2(Number(detalle.haber ?? 0));
      if (debe < 0 || haber < 0) {
        throw new BadRequestException('Debe y haber no pueden ser negativos');
      }
      if ((debe === 0 && haber === 0) || (debe > 0 && haber > 0)) {
        throw new BadRequestException(
          'Cada detalle debe tener debe o haber, pero no ambos',
        );
      }

      const centroCostoId =
        centrosDetalleInternos !== undefined
          ? (centrosDetalleInternos[index] ?? centroCostoPorDefectoId)
          : detalle.centroCostoId
            ? await this.resolverCentroCosto(manager, detalle.centroCostoId)
            : centroCostoPorDefectoId;

      totalDebe = this.redondear2(totalDebe + debe);
      totalHaber = this.redondear2(totalHaber + haber);

      resueltos.push({
        cuentaId: cuenta.id,
        concepto: detalle.concepto ?? null,
        debe,
        haber,
        referencia: detalle.referencia ?? null,
        orden: index + 1,
        centroCostoId,
      });
    }

    if (totalDebe <= 0 || totalDebe !== totalHaber) {
      throw new BadRequestException(
        `La póliza no está cuadrada. Debe: ${totalDebe.toFixed(2)}, Haber: ${totalHaber.toFixed(2)}`,
      );
    }

    return { detalles: resueltos, totalDebe, totalHaber };
  }

  private async resolverCentroCosto(
    manager: EntityManager,
    publicId?: string | null,
    internoId?: number | null,
  ): Promise<number | null> {
    const repositorio = manager.getRepository(CentroCosto);

    if (internoId !== undefined && internoId !== null) {
      const centro = await repositorio.findOne({ where: { id: internoId } });
      if (!centro) {
        throw new BadRequestException(
          `El centro de costo ${internoId} no existe`,
        );
      }
      return centro.id;
    }

    if (!publicId) return null;

    const centro = await repositorio.findOne({ where: { publicId } });
    if (!centro) {
      throw new BadRequestException(`El centro de costo ${publicId} no existe`);
    }
    if (!centro.activo) {
      throw new BadRequestException(
        `El centro de costo ${centro.codigo} está inactivo`,
      );
    }
    return centro.id;
  }

  private generarFolio(anio: number, mes: number, secuencial: number) {
    return `POL-${anio}${String(mes).padStart(2, '0')}-${String(secuencial).padStart(4, '0')}`;
  }

  private redondear2(valor: number) {
    return Math.round(valor * 100) / 100;
  }
}
