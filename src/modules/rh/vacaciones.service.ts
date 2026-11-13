import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Empleado } from './entities/empleado.entity';
import { PoliticaVacacional } from './entities/politica-vacacional.entity';
import { PeriodoVacacional } from './entities/periodo-vacacional.entity';
import { SolicitudPermiso } from './entities/solicitud-permiso.entity';
import { CreatePoliticaVacacionalDto } from './dto/create-politica-vacacional.dto';
import { UpdatePoliticaVacacionalDto } from './dto/update-politica-vacacional.dto';
import { ConsultaSaldoVacacionalDto } from './dto/consulta-saldo-vacacional.dto';
import {
  agregarAnios,
  agregarDias,
  agregarMeses,
  calcularAntiguedad,
  fechaUtc,
  validarFecha,
} from './helpers/vacaciones.helpers';

@Injectable()
export class VacacionesService implements OnModuleInit {
  constructor(
    @InjectRepository(PoliticaVacacional)
    private readonly politicaVacacionalRepository: Repository<PoliticaVacacional>,
    @InjectRepository(PeriodoVacacional)
    private readonly periodoVacacionalRepository: Repository<PeriodoVacacional>,
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
    @InjectRepository(SolicitudPermiso)
    private readonly permisoRepository: Repository<SolicitudPermiso>,
  ) {}

  async onModuleInit() {
    const totalPoliticas = await this.politicaVacacionalRepository.count();
    if (totalPoliticas > 0) return;

    const politicas = [
      { aniosDesde: 1, aniosHasta: 1, diasOtorgados: 12 },
      { aniosDesde: 2, aniosHasta: 2, diasOtorgados: 14 },
      { aniosDesde: 3, aniosHasta: 3, diasOtorgados: 16 },
      { aniosDesde: 4, aniosHasta: 4, diasOtorgados: 18 },
      { aniosDesde: 5, aniosHasta: 5, diasOtorgados: 20 },
      { aniosDesde: 6, aniosHasta: 10, diasOtorgados: 22 },
      { aniosDesde: 11, aniosHasta: 15, diasOtorgados: 24 },
      { aniosDesde: 16, aniosHasta: 20, diasOtorgados: 26 },
      { aniosDesde: 21, aniosHasta: 25, diasOtorgados: 28 },
      { aniosDesde: 26, aniosHasta: 30, diasOtorgados: 30 },
      { aniosDesde: 31, aniosHasta: 35, diasOtorgados: 32 },
      { aniosDesde: 36, aniosHasta: 40, diasOtorgados: 34 },
      { aniosDesde: 41, aniosHasta: 45, diasOtorgados: 36 },
      { aniosDesde: 46, aniosHasta: 50, diasOtorgados: 38 },
      { aniosDesde: 51, aniosHasta: 55, diasOtorgados: 40 },
    ];

    await this.politicaVacacionalRepository.save(
      this.politicaVacacionalRepository.create(politicas),
    );
  }

  async buscarPoliticasVacacionales() {
    return this.politicaVacacionalRepository.find({
      where: { activo: true },
      order: { aniosDesde: 'ASC' },
    });
  }

  async crearPoliticaVacacional(dto: CreatePoliticaVacacionalDto) {
    const aniosHasta = dto.aniosHasta ?? null;
    this.validarRangoPolitica(dto.aniosDesde, aniosHasta);
    const politicas = await this.politicaVacacionalRepository.find({
      where: { activo: true },
    });
    this.validarTraslapePolitica(politicas, dto.aniosDesde, aniosHasta);

    const politica = this.politicaVacacionalRepository.create({
      ...dto,
      aniosHasta,
    });
    return this.politicaVacacionalRepository.save(politica);
  }

  async actualizarPoliticaVacacional(
    publicId: string,
    dto: UpdatePoliticaVacacionalDto,
  ) {
    const politica = await this.politicaVacacionalRepository.findOne({
      where: { publicId },
    });
    if (!politica)
      throw new BadRequestException(
        `La política vacacional ${publicId} no existe`,
      );

    const aniosDesde = dto.aniosDesde ?? politica.aniosDesde;
    const aniosHasta =
      dto.aniosHasta === undefined ? politica.aniosHasta : dto.aniosHasta;
    this.validarRangoPolitica(aniosDesde, aniosHasta ?? null);
    const politicas = await this.politicaVacacionalRepository.find({
      where: { activo: true },
    });
    this.validarTraslapePolitica(
      politicas.filter((item) => item.id !== politica.id),
      aniosDesde,
      aniosHasta ?? null,
    );

    await this.politicaVacacionalRepository.update(politica.id, {
      aniosDesde,
      aniosHasta: aniosHasta ?? null,
      diasOtorgados: dto.diasOtorgados ?? politica.diasOtorgados,
    });
    return { msg: 'Política vacacional actualizada exitosamente' };
  }

  async obtenerSaldoVacacional(consulta: ConsultaSaldoVacacionalDto) {
    const {
      empleadoId,
      fechaCorte,
      pagina = 1,
      registros = 10,
      buscar,
      activo,
    } = consulta;

    const corte = fechaCorte
      ? validarFecha(fechaCorte, 'fechaCorte')
      : fechaUtc(new Date());

    if (empleadoId) {
      const empleado = await this.empleadoRepository.findOne({
        where: { publicId: empleadoId },
      });
      if (!empleado)
        throw new BadRequestException(`El empleado ${empleadoId} no existe`);
      return this.construirSaldo(empleado, corte);
    }

    const query = this.empleadoRepository.createQueryBuilder('empleado');

    if (activo !== undefined) {
      query.andWhere('empleado.activo = :activo', { activo });
    }

    const busqueda = buscar?.trim();
    if (busqueda) {
      query.andWhere(
        `(empleado.nombre || ' ' || empleado.apellidoPaterno || ' ' || COALESCE(empleado.apellidoMaterno, '')) ILIKE :busqueda
          OR empleado.codigo ILIKE :busqueda`,
        { busqueda: `%${busqueda}%` },
      );
    }

    const [empleados, total] = await query
      .orderBy('empleado.nombre', 'ASC')
      .addOrderBy('empleado.apellidoPaterno', 'ASC')
      .addOrderBy('empleado.apellidoMaterno', 'ASC')
      .skip((pagina - 1) * registros)
      .take(registros)
      .getManyAndCount();

    const data = await Promise.all(
      empleados.map((empleado) => this.construirSaldo(empleado, corte)),
    );

    return { total, pagina, registros, data };
  }

  private async construirSaldo(empleado: Empleado, corte: Date) {
    const nombre = [
      empleado.nombre,
      empleado.apellidoPaterno,
      empleado.apellidoMaterno,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    const antiguedadAnios = calcularAntiguedad(empleado.fechaIngreso, corte);
    if (antiguedadAnios < 1) {
      return {
        empleadoId: empleado.publicId,
        codigo: empleado.codigo,
        nombre,
        antiguedadAnios: 0,
        diasOtorgados: 0,
        diasUsados: 0,
        diasPendientes: 0,
        diasDisponibles: 0,
        descripcionPeriodo: null,
        mensaje: 'El empleado aún no cumple un año de antigüedad',
      };
    }

    const periodo = await this.obtenerOCrearPeriodo(empleado, corte);
    const consumo = await this.obtenerConsumoPeriodo(periodo);
    return {
      empleadoId: empleado.publicId,
      codigo: empleado.codigo,
      nombre,
      antiguedadAnios,
      periodoVacacionalId: periodo.publicId,
      descripcionPeriodo:
        periodo.descripcion ??
        this.describirPeriodo(periodo.fechaInicio, periodo.fechaFin),
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
      fechaLimiteDisfrute: periodo.fechaLimiteDisfrute,
      diasOtorgados: periodo.diasOtorgados,
      diasUsados: consumo.diasAprobados,
      diasPendientes: consumo.diasPendientes,
      diasDisponibles: Math.max(
        periodo.diasOtorgados - consumo.diasAprobados - consumo.diasPendientes,
        0,
      ),
    };
  }

  async buscarHistorialVacacional(empleadoId: string) {
    const empleado = await this.empleadoRepository.findOne({
      where: { publicId: empleadoId },
    });
    if (!empleado)
      throw new BadRequestException(`El empleado ${empleadoId} no existe`);

    const antiguedadAnios = calcularAntiguedad(
      empleado.fechaIngreso,
      fechaUtc(new Date()),
    );
    if (antiguedadAnios >= 1) {
      await this.obtenerOCrearPeriodo(empleado, fechaUtc(new Date()));
    }

    const periodos = await this.periodoVacacionalRepository.find({
      where: { empleadoId: empleado.id },
      order: { fechaInicio: 'DESC' },
    });
    return Promise.all(
      periodos.map(async (periodo) => {
        const consumo = await this.obtenerConsumoPeriodo(periodo);
        return {
          ...periodo,
          diasUsados: consumo.diasAprobados,
          diasPendientes: consumo.diasPendientes,
          diasDisponibles: Math.max(
            periodo.diasOtorgados -
              consumo.diasAprobados -
              consumo.diasPendientes,
            0,
          ),
        };
      }),
    );
  }

  async obtenerOCrearPeriodo(empleado: Empleado, fecha: Date) {
    const fechaConsulta = fechaUtc(fecha);
    const antiguedadAnios = calcularAntiguedad(
      empleado.fechaIngreso,
      fechaConsulta,
    );
    if (antiguedadAnios < 1) {
      throw new BadRequestException(
        'El empleado aún no cumple un año de antigüedad',
      );
    }

    const fechaInicio = agregarAnios(empleado.fechaIngreso, antiguedadAnios);
    const fechaFin = agregarDias(agregarAnios(fechaInicio, 1), -1);
    const fechaLimiteDisfrute = agregarMeses(fechaInicio, 6);
    const politica = await this.buscarPoliticaParaAntiguedad(antiguedadAnios);
    const existente = await this.periodoVacacionalRepository.findOne({
      where: { empleadoId: empleado.id, fechaInicio },
    });
    if (existente) {
      if (!existente.descripcion) {
        existente.descripcion = this.describirPeriodo(
          existente.fechaInicio,
          existente.fechaFin,
        );
        await this.periodoVacacionalRepository.update(existente.id, {
          descripcion: existente.descripcion,
        });
      }
      return existente;
    }

    return this.periodoVacacionalRepository.save(
      this.periodoVacacionalRepository.create({
        empleadoId: empleado.id,
        fechaInicio,
        fechaFin,
        fechaLimiteDisfrute,
        descripcion: this.describirPeriodo(fechaInicio, fechaFin),
        antiguedadAnios,
        diasOtorgados: politica.diasOtorgados,
        diasUsados: 0,
      }),
    );
  }

  private describirPeriodo(fechaInicio: Date, fechaFin: Date) {
    const anioInicio = fechaUtc(fechaInicio).getUTCFullYear();
    const anioFin = fechaUtc(fechaFin).getUTCFullYear();
    return `Periodo vacacional ${anioInicio}-${anioFin}`;
  }

  private async buscarPoliticaParaAntiguedad(antiguedadAnios: number) {
    const politicas = await this.politicaVacacionalRepository.find({
      where: { activo: true },
      order: { aniosDesde: 'DESC' },
    });
    const politica = politicas.find(
      (item) =>
        item.aniosDesde <= antiguedadAnios &&
        (item.aniosHasta === null || item.aniosHasta >= antiguedadAnios),
    );
    if (!politica && antiguedadAnios >= 56) {
      return {
        diasOtorgados: 40 + Math.floor((antiguedadAnios - 51) / 5) * 2,
      } as PoliticaVacacional;
    }
    if (!politica) {
      throw new BadRequestException(
        `No existe una política vacacional para ${antiguedadAnios} años de antigüedad`,
      );
    }
    return politica;
  }

  private async obtenerConsumoPeriodo(periodo: PeriodoVacacional) {
    const solicitudes = await this.permisoRepository.find({
      where: {
        periodoVacacionalId: periodo.id,
        tipo: 'vacaciones',
        estatus: In(['pendiente', 'aprobada']),
      },
    });
    return {
      diasAprobados: solicitudes
        .filter((solicitud) => solicitud.estatus === 'aprobada')
        .reduce(
          (total, solicitud) => total + (solicitud.diasSolicitados || 0),
          0,
        ),
      diasPendientes: solicitudes
        .filter((solicitud) => solicitud.estatus === 'pendiente')
        .reduce(
          (total, solicitud) => total + (solicitud.diasSolicitados || 0),
          0,
        ),
    };
  }

  private validarRangoPolitica(aniosDesde: number, aniosHasta: number | null) {
    if (aniosHasta !== null && aniosHasta < aniosDesde) {
      throw new BadRequestException('El rango de antigüedad no es válido');
    }
  }

  private validarTraslapePolitica(
    politicas: PoliticaVacacional[],
    aniosDesde: number,
    aniosHasta: number | null,
  ) {
    const traslapa = politicas.some(
      (politica) =>
        politica.aniosDesde <= (aniosHasta ?? Number.MAX_SAFE_INTEGER) &&
        (politica.aniosHasta === null || politica.aniosHasta >= aniosDesde),
    );
    if (traslapa)
      throw new BadRequestException(
        'El rango de antigüedad se traslapa con otra política',
      );
  }
}
