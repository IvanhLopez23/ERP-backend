import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Nomina } from './entities/nomina.entity';
import { NominaDetalle } from './entities/nomina-detalle.entity';
import { Empleado } from '../rh/entities/empleado.entity';
import { IntegracionContableService } from './integracion-contable.service';
import { CreateNominaDto } from './dto/create-nomina.dto';
import { NominaQueryDto, NominaPreviewQueryDto } from './dto/nomina.query.dto';

@Injectable()
export class NominaService {
  constructor(
    @InjectRepository(Nomina)
    private readonly nominaRepository: Repository<Nomina>,
    @InjectRepository(NominaDetalle)
    private readonly detalleRepository: Repository<NominaDetalle>,
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
    private readonly dataSource: DataSource,
    private readonly integracionContableService: IntegracionContableService,
  ) {}

  async preview(query: NominaPreviewQueryDto) {
    const hoy = new Date();
    const anio = query.anio ?? hoy.getFullYear();
    const mes = query.mes ?? hoy.getMonth() + 1;
    const empleados = await this.empleadosActivos();

    const filas = empleados.map((empleado) => {
      const salarioBase = this.redondear2(Number(empleado.salario) || 0);
      return {
        publicId: empleado.publicId,
        codigo: empleado.codigo,
        nombre: this.nombreEmpleado(empleado),
        centroCosto: empleado.centroCosto?.codigo ?? null,
        salarioBase,
        percepciones: salarioBase,
        isr: 0,
        imss: 0,
        otrasDeducciones: 0,
        neto: salarioBase,
      };
    });

    const totales = this.totalesPreview(filas);
    return { anio, mes, empleados: filas, totales };
  }

  async crear(dto: CreateNominaDto, usuarioId: number) {
    const existente = await this.nominaRepository.findOne({
      where: { anio: dto.anio, mes: dto.mes },
    });
    if (existente) {
      throw new BadRequestException(
        `La nómina ${dto.anio}-${String(dto.mes).padStart(2, '0')} ya existe`,
      );
    }

    const empleados = await this.resolverEmpleados(dto);
    if (!empleados.length) {
      throw new BadRequestException(
        'No hay empleados activos con salario para procesar',
      );
    }

    const ajustes = new Map(
      (dto.empleados ?? []).map((ajuste) => [ajuste.empleadoId, ajuste]),
    );
    if (ajustes.size && ajustes.size !== empleados.length) {
      throw new BadRequestException(
        'Uno o más empleados enviados no existen o están inactivos',
      );
    }

    const detalles = empleados.map((empleado) => {
      const ajuste = ajustes.get(empleado.publicId);
      const salarioBase = this.redondear2(Number(empleado.salario) || 0);
      const percepciones = this.redondear2(ajuste?.percepciones ?? salarioBase);
      const isr = this.redondear2(ajuste?.isr ?? 0);
      const imss = this.redondear2(ajuste?.imss ?? 0);
      const otrasDeducciones = this.redondear2(ajuste?.otrasDeducciones ?? 0);
      const neto = this.redondear2(
        percepciones - isr - imss - otrasDeducciones,
      );
      if (neto < 0) {
        throw new BadRequestException(
          `El neto del empleado ${empleado.codigo} no puede ser negativo`,
        );
      }
      return {
        empleadoId: empleado.id,
        centroCostoId: empleado.centroCostoId ?? null,
        salarioBase,
        percepciones,
        isr,
        imss,
        otrasDeducciones,
        neto,
      };
    });

    const totalPercepciones = this.redondear2(
      detalles.reduce((total, detalle) => total + detalle.percepciones, 0),
    );
    const totalIsr = this.redondear2(
      detalles.reduce((total, detalle) => total + detalle.isr, 0),
    );
    const totalImss = this.redondear2(
      detalles.reduce((total, detalle) => total + detalle.imss, 0),
    );
    const totalOtrasDeducciones = this.redondear2(
      detalles.reduce((total, detalle) => total + detalle.otrasDeducciones, 0),
    );
    const totalNeto = this.redondear2(
      detalles.reduce((total, detalle) => total + detalle.neto, 0),
    );
    const imssPatronal = this.redondear2(dto.imssPatronal ?? 0);
    const provisionPrestaciones = this.redondear2(
      dto.provisionPrestaciones ?? 0,
    );
    const fecha = dto.fecha ?? this.hoy();

    if (
      totalPercepciones <= 0 &&
      imssPatronal <= 0 &&
      provisionPrestaciones <= 0
    ) {
      throw new BadRequestException(
        'La nómina no tiene importes para contabilizar',
      );
    }

    const salariosPorCentro = new Map<
      string,
      { centroCostoId: number | null; monto: number }
    >();
    for (const detalle of detalles) {
      const key = detalle.centroCostoId
        ? String(detalle.centroCostoId)
        : 'null';
      const actual = salariosPorCentro.get(key) ?? {
        centroCostoId: detalle.centroCostoId,
        monto: 0,
      };
      actual.monto = this.redondear2(actual.monto + detalle.percepciones);
      salariosPorCentro.set(key, actual);
    }

    try {
      const nominaId = await this.dataSource.transaction(async (manager) => {
        const poliza = await this.integracionContableService.registrarNomina(
          fecha,
          dto.anio,
          dto.mes,
          [...salariosPorCentro.values()],
          totalIsr,
          totalImss,
          totalNeto,
          imssPatronal,
          provisionPrestaciones,
          usuarioId,
          manager,
        );

        const nominaRepo = manager.getRepository(Nomina);
        const nomina = await nominaRepo.save(
          nominaRepo.create({
            anio: dto.anio,
            mes: dto.mes,
            fecha,
            estatus: 'contabilizada',
            totalPercepciones,
            totalIsr,
            totalImss,
            totalOtrasDeducciones,
            totalNeto,
            imssPatronal,
            provisionPrestaciones,
            polizaId: poliza?.id ?? null,
            usuarioId,
          }),
        );

        const detalleRepo = manager.getRepository(NominaDetalle);
        await detalleRepo.save(
          detalles.map((detalle) =>
            detalleRepo.create({ ...detalle, nominaId: nomina.id }),
          ),
        );

        return nomina.id;
      });

      return this.buscarPorIdInterno(nominaId);
    } catch (error) {
      if (this.esDuplicado(error)) {
        throw new BadRequestException(
          `La nómina ${dto.anio}-${String(dto.mes).padStart(2, '0')} ya existe`,
        );
      }
      throw error;
    }
  }

  async buscar(query: NominaQueryDto) {
    const nominas = await this.nominaRepository.find({
      where: query.anio ? { anio: query.anio } : {},
      relations: {
        poliza: true,
        detalles: { empleado: true, centroCosto: true },
      },
      order: { anio: 'DESC', mes: 'DESC' },
    });
    return nominas.map((nomina) => this.formatearNomina(nomina));
  }

  async buscarPorId(publicId: string) {
    const nomina = await this.nominaRepository.findOne({
      where: { publicId },
      relations: {
        poliza: true,
        detalles: { empleado: true, centroCosto: true },
      },
    });
    if (!nomina) {
      throw new BadRequestException(`La nómina ${publicId} no existe`);
    }

    return this.formatearNomina(nomina);
  }

  private async buscarPorIdInterno(id: number) {
    const nomina = await this.nominaRepository.findOne({
      where: { id },
      relations: {
        poliza: true,
        detalles: { empleado: true, centroCosto: true },
      },
    });
    if (!nomina) {
      throw new BadRequestException(`La nómina ${id} no existe`);
    }
    return this.formatearNomina(nomina);
  }

  private formatearNomina(nomina: Nomina) {
    const detalles = (nomina.detalles ?? []).map((detalle) => ({
      publicId: detalle.publicId,
      codigo: detalle.empleado?.codigo ?? '',
      nombre: detalle.empleado
        ? this.nombreEmpleado(detalle.empleado)
        : 'Empleado',
      centroCosto: detalle.centroCosto?.codigo ?? null,
      salarioBase: this.redondear2(detalle.salarioBase),
      percepciones: this.redondear2(detalle.percepciones),
      isr: this.redondear2(detalle.isr),
      imss: this.redondear2(detalle.imss),
      otrasDeducciones: this.redondear2(detalle.otrasDeducciones),
      neto: this.redondear2(detalle.neto),
    }));

    const porCentroMap = new Map<
      string,
      {
        codigo: string | null;
        nombre: string;
        percepciones: number;
        isr: number;
        imss: number;
        neto: number;
        empleados: number;
      }
    >();
    for (const detalle of nomina.detalles ?? []) {
      const key = detalle.centroCostoId
        ? String(detalle.centroCostoId)
        : 'null';
      const actual = porCentroMap.get(key) ?? {
        codigo: detalle.centroCosto?.codigo ?? null,
        nombre: detalle.centroCosto?.nombre ?? 'Sin centro de costo',
        percepciones: 0,
        isr: 0,
        imss: 0,
        neto: 0,
        empleados: 0,
      };
      actual.percepciones = this.redondear2(
        actual.percepciones + Number(detalle.percepciones),
      );
      actual.isr = this.redondear2(actual.isr + Number(detalle.isr));
      actual.imss = this.redondear2(actual.imss + Number(detalle.imss));
      actual.neto = this.redondear2(actual.neto + Number(detalle.neto));
      actual.empleados += 1;
      porCentroMap.set(key, actual);
    }

    return {
      publicId: nomina.publicId,
      anio: nomina.anio,
      mes: nomina.mes,
      fecha: this.fechaString(nomina.fecha),
      estatus: nomina.estatus,
      totalPercepciones: this.redondear2(nomina.totalPercepciones),
      totalIsr: this.redondear2(nomina.totalIsr),
      totalImss: this.redondear2(nomina.totalImss),
      totalOtrasDeducciones: this.redondear2(nomina.totalOtrasDeducciones),
      totalNeto: this.redondear2(nomina.totalNeto),
      imssPatronal: this.redondear2(nomina.imssPatronal),
      provisionPrestaciones: this.redondear2(nomina.provisionPrestaciones),
      poliza: nomina.poliza
        ? { publicId: nomina.poliza.publicId, folio: nomina.poliza.folio }
        : null,
      detalles,
      porCentro: [...porCentroMap.values()],
    };
  }

  private async resolverEmpleados(dto: CreateNominaDto) {
    if (dto.empleados?.length) {
      const publicIds = dto.empleados.map((empleado) => empleado.empleadoId);
      const empleados = await this.empleadoRepository.find({
        where: { publicId: In(publicIds), activo: true },
        relations: { centroCosto: true },
        order: { nombre: 'ASC' },
      });
      if (empleados.length !== publicIds.length) {
        throw new BadRequestException(
          'Uno o más empleados no existen o están inactivos',
        );
      }
      return empleados;
    }
    return this.empleadosActivos();
  }

  private empleadosActivos() {
    return this.empleadoRepository.find({
      where: { activo: true },
      relations: { centroCosto: true },
      order: { nombre: 'ASC' },
    });
  }

  private totalesPreview(
    filas: Array<{
      percepciones: number;
      isr: number;
      imss: number;
      otrasDeducciones: number;
      neto: number;
    }>,
  ) {
    return {
      percepciones: this.redondear2(
        filas.reduce((total, fila) => total + fila.percepciones, 0),
      ),
      isr: this.redondear2(filas.reduce((total, fila) => total + fila.isr, 0)),
      imss: this.redondear2(
        filas.reduce((total, fila) => total + fila.imss, 0),
      ),
      otrasDeducciones: this.redondear2(
        filas.reduce((total, fila) => total + fila.otrasDeducciones, 0),
      ),
      neto: this.redondear2(
        filas.reduce((total, fila) => total + fila.neto, 0),
      ),
    };
  }

  private nombreEmpleado(empleado: Empleado) {
    return [empleado.nombre, empleado.apellidoPaterno, empleado.apellidoMaterno]
      .filter(Boolean)
      .join(' ');
  }

  private esDuplicado(error: unknown) {
    const detalle = error as {
      code?: string;
      driverError?: { code?: string };
    };
    return detalle?.driverError?.code === '23505' || detalle?.code === '23505';
  }

  private hoy() {
    return this.fechaString(new Date());
  }

  private fechaString(fecha: Date | string) {
    if (typeof fecha === 'string') return fecha.slice(0, 10);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private redondear2(valor: number) {
    return Math.round(Number(valor) * 100) / 100;
  }
}
