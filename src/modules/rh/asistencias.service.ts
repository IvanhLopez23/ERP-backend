import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Departamento } from './entities/departamento.entity';
import { Empleado } from './entities/empleado.entity';
import { Asistencia } from './entities/asistencia.entity';
import { Turno } from './entities/turno.entity';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { BuscarAsistenciasDto } from './dto/buscar-asistencias.dto';

const DIAS_SEMANA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const;
const MINUTOS_DIA = 24 * 60;

function aMinutos(hora?: string | null): number | null {
  if (!hora) return null;
  const coincidencia = /^(\d{1,2}):(\d{2})/.exec(hora);
  if (!coincidencia) return null;
  return Number(coincidencia[1]) * 60 + Number(coincidencia[2]);
}

export type CalculoAsistencia = {
  retardoMinutos: number;
  salidaAnticipadaMinutos: number;
  horasTrabajadas: number | null;
  turnoId: number | null;
};

@Injectable()
export class AsistenciasService {
  constructor(
    @InjectRepository(Departamento)
    private readonly deptoRepository: Repository<Departamento>,
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
  ) {}

  /**
   * Calcula retardo, salida anticipada y horas trabajadas comparando el
   * registro contra el horario del turno asignado al empleado.
   */
  calcularHorario(
    dto: CreateAsistenciaDto,
    turno?: Turno | null,
  ): CalculoAsistencia {
    const base: CalculoAsistencia = {
      retardoMinutos: 0,
      salidaAnticipadaMinutos: 0,
      horasTrabajadas: null,
      turnoId: turno?.id ?? null,
    };

    if (!turno || dto.estatus !== 'presente') return base;

    const entrada = aMinutos(dto.horaEntrada);
    const salida = aMinutos(dto.horaSalida);
    const esperadaEntrada = aMinutos(turno.horaEntrada);
    let esperadaSalida = aMinutos(turno.horaSalida);

    if (
      esperadaEntrada !== null &&
      esperadaSalida !== null &&
      esperadaSalida <= esperadaEntrada
    ) {
      esperadaSalida += MINUTOS_DIA;
    }

    const fecha = new Date(`${dto.fecha}T00:00:00`);
    const dia = Number.isNaN(fecha.getTime())
      ? null
      : DIAS_SEMANA[fecha.getDay()];
    const labora =
      dia !== null &&
      turno.diasLaborables
        .split(',')
        .map((valor) => valor.trim())
        .includes(dia);

    let retardoMinutos = 0;
    if (labora && entrada !== null && esperadaEntrada !== null) {
      retardoMinutos = Math.max(
        0,
        entrada - esperadaEntrada - (turno.toleranciaMinutos ?? 0),
      );
    }

    let salidaAnticipadaMinutos = 0;
    if (labora && salida !== null && esperadaSalida !== null) {
      let salidaAjustada = salida;
      if (entrada !== null && salidaAjustada <= entrada) {
        salidaAjustada += MINUTOS_DIA;
      } else if (esperadaSalida > MINUTOS_DIA && salidaAjustada < MINUTOS_DIA) {
        salidaAjustada += MINUTOS_DIA;
      }
      salidaAnticipadaMinutos = Math.max(0, esperadaSalida - salidaAjustada);
    }

    let horasTrabajadas: number | null = null;
    if (entrada !== null && salida !== null) {
      const salidaAjustada = salida <= entrada ? salida + MINUTOS_DIA : salida;
      let descanso = 0;
      const comidaInicio = aMinutos(turno.horaComidaInicio);
      const comidaFin = aMinutos(turno.horaComidaFin);
      if (
        comidaInicio !== null &&
        comidaFin !== null &&
        comidaFin > comidaInicio
      ) {
        const solapeInicio = Math.max(entrada, comidaInicio);
        const solapeFin = Math.min(salidaAjustada, comidaFin);
        if (solapeFin > solapeInicio) descanso = solapeFin - solapeInicio;
      }
      horasTrabajadas = Math.max(0, salidaAjustada - entrada - descanso) / 60;
      horasTrabajadas = Number(horasTrabajadas.toFixed(2));
    }

    return {
      retardoMinutos: Math.round(retardoMinutos),
      salidaAnticipadaMinutos: Math.round(salidaAnticipadaMinutos),
      horasTrabajadas,
      turnoId: turno.id,
    };
  }

  async crearAsistencia(dto: CreateAsistenciaDto) {
    try {
      const empleado = await this.empleadoRepository.findOne({
        where: { publicId: dto.empleadoId },
        relations: { turno: true },
      });
      if (!empleado)
        throw new BadRequestException(
          `El empleado ${dto.empleadoId} no existe`,
        );
      const existe = await this.asistenciaRepository.findOne({
        where: { empleadoId: empleado.id, fecha: dto.fecha as any },
      });
      if (existe)
        throw new BadRequestException(
          'Ya existe un registro de asistencia para este empleado en la fecha indicada',
        );

      const calculo = this.calcularHorario(dto, empleado.turno);
      const data = this.asistenciaRepository.create({
        ...dto,
        empleadoId: empleado.id,
        fecha: dto.fecha as any,
        ...calculo,
      });
      return await this.asistenciaRepository.save(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarAsistencias(query: BuscarAsistenciasDto) {
    if (query.fecha) return this.buscarAsistenciasDelDia(query);
    return this.buscarHistorialAsistencias(query);
  }

  /**
   * Lista a todos los empleados activos para un día, con su registro de
   * asistencia cuando exista.
   */
  private async buscarAsistenciasDelDia(query: BuscarAsistenciasDto) {
    const { registros = 10, pagina = 1, buscar } = query;
    const fecha = query.fecha as string;

    const empleadoQb = this.empleadoRepository
      .createQueryBuilder('empleado')
      .leftJoinAndSelect('empleado.departamento', 'departamento')
      .leftJoinAndSelect('empleado.puesto', 'puesto')
      .leftJoinAndSelect('empleado.turno', 'turno')
      .where('empleado.activo = true');

    if (query.empleadoId) {
      const empleado = await this.empleadoRepository.findOne({
        where: { publicId: query.empleadoId },
      });
      if (!empleado)
        throw new BadRequestException(
          `El empleado ${query.empleadoId} no existe`,
        );
      empleadoQb.andWhere('empleado.id = :empleadoId', {
        empleadoId: empleado.id,
      });
    }

    if (query.departamentoId) {
      const departamento = await this.deptoRepository.findOne({
        where: { publicId: query.departamentoId },
      });
      if (!departamento)
        throw new BadRequestException(
          `El departamento ${query.departamentoId} no existe`,
        );
      empleadoQb.andWhere('empleado.departamentoId = :departamentoId', {
        departamentoId: departamento.id,
      });
    }

    const busqueda = buscar?.trim();
    if (busqueda) {
      empleadoQb.andWhere(
        `((empleado.nombre || ' ' || empleado.apellidoPaterno || ' ' || COALESCE(empleado.apellidoMaterno, '')) ILIKE :buscar
          OR empleado.codigo ILIKE :buscar)`,
        { buscar: `%${busqueda}%` },
      );
    }

    const [empleados, total] = await empleadoQb
      .orderBy('empleado.apellidoPaterno', 'ASC')
      .addOrderBy('empleado.apellidoMaterno', 'ASC')
      .addOrderBy('empleado.nombre', 'ASC')
      .skip((pagina - 1) * registros)
      .take(registros)
      .getManyAndCount();

    if (empleados.length === 0) {
      return { total, pagina, registros, data: [] };
    }

    const asistencias = await this.asistenciaRepository.find({
      where: {
        empleadoId: In(empleados.map((empleado) => empleado.id)),
        fecha: fecha as any,
      },
      relations: { empleado: true, turno: true },
    });

    const porEmpleado = new Map(
      asistencias.map((asistencia) => [
        asistencia.empleado?.publicId,
        asistencia,
      ]),
    );

    const data = empleados.map((empleado) => {
      const asistencia = porEmpleado.get(empleado.publicId);
      return {
        publicId: asistencia?.publicId ?? empleado.publicId,
        asistenciaId: asistencia?.publicId ?? null,
        empleadoId: empleado.publicId,
        fecha,
        horaEntrada: asistencia?.horaEntrada ?? null,
        horaSalida: asistencia?.horaSalida ?? null,
        estatus: asistencia?.estatus ?? 'sin_registro',
        retardoMinutos: asistencia?.retardoMinutos ?? 0,
        salidaAnticipadaMinutos: asistencia?.salidaAnticipadaMinutos ?? 0,
        horasTrabajadas: asistencia?.horasTrabajadas ?? null,
        observaciones: asistencia?.observaciones ?? null,
        turno: asistencia?.turno ?? empleado.turno ?? null,
        empleado: {
          publicId: empleado.publicId,
          codigo: empleado.codigo,
          nombre: empleado.nombre,
          apellidoPaterno: empleado.apellidoPaterno,
          apellidoMaterno: empleado.apellidoMaterno,
          departamento: empleado.departamento,
          puesto: empleado.puesto,
        },
      };
    });

    return { total, pagina, registros, data };
  }

  private async buscarHistorialAsistencias(query: BuscarAsistenciasDto) {
    const {
      registros = 10,
      pagina = 1,
      empleadoId,
      departamentoId,
      fechaDesde,
      fechaHasta,
    } = query;
    const where: any = {};
    if (empleadoId) {
      const empleado = await this.empleadoRepository.findOne({
        where: { publicId: empleadoId },
      });
      if (!empleado)
        throw new BadRequestException(`El empleado ${empleadoId} no existe`);
      where.empleadoId = empleado.id;
    }
    if (departamentoId) {
      const departamento = await this.deptoRepository.findOne({
        where: { publicId: departamentoId },
      });
      if (!departamento)
        throw new BadRequestException(
          `El departamento ${departamentoId} no existe`,
        );
      where.empleado = { departamentoId: departamento.id };
    }
    if (fechaDesde && fechaHasta) {
      where.fecha = And(
        MoreThanOrEqual(fechaDesde),
        LessThanOrEqual(fechaHasta),
      );
    } else if (fechaDesde) {
      where.fecha = MoreThanOrEqual(fechaDesde);
    } else if (fechaHasta) {
      where.fecha = LessThanOrEqual(fechaHasta);
    }
    const data = await this.asistenciaRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: {
        empleado: {
          puesto: true,
          departamento: true,
        },
        turno: true,
      },
      order: { fecha: 'DESC' },
    });
    const total = await this.asistenciaRepository.count({ where });
    return { total, data };
  }
}
