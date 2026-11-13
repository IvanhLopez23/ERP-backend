import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Empleado } from './entities/empleado.entity';
import { SolicitudPermiso } from './entities/solicitud-permiso.entity';
import { PeriodoVacacional } from './entities/periodo-vacacional.entity';
import { CreateSolicitudPermisoDto } from './dto/create-solicitud-permiso.dto';
import { UpdateEstatusPermisoDto } from './dto/update-estatus-permiso.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { VacacionesService } from './vacaciones.service';
import { UploadsService } from '../uploads/uploads.service';
import {
  contarDiasLaborables,
  fechaUtc,
  validarFecha,
} from './helpers/vacaciones.helpers';

@Injectable()
export class SolicitudesPermisoService {
  constructor(
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
    @InjectRepository(SolicitudPermiso)
    private readonly permisoRepository: Repository<SolicitudPermiso>,
    private readonly vacacionesService: VacacionesService,
    private readonly uploadsService: UploadsService,
    private readonly dataSource: DataSource,
  ) {}

  async crearSolicitudPermiso(dto: CreateSolicitudPermisoDto) {
    try {
      const empleado = await this.empleadoRepository.findOne({
        where: { publicId: dto.empleadoId },
      });
      if (!empleado)
        throw new BadRequestException(
          `El empleado ${dto.empleadoId} no existe`,
        );

      let fechaInicio: Date;
      let fechaFin: Date;
      let diasSolicitados: number | undefined;
      let periodoVacacionalId: number | undefined;

      if (dto.tipo === 'vacaciones') {
        if (!empleado.activo)
          throw new BadRequestException('El empleado no está activo');
        fechaInicio = validarFecha(dto.fechaInicio, 'fechaInicio');
        fechaFin = validarFecha(dto.fechaFin, 'fechaFin');
        if (fechaInicio > fechaFin) {
          throw new BadRequestException(
            'La fecha de inicio no puede ser posterior a la fecha de fin',
          );
        }

        const periodo = await this.vacacionesService.obtenerOCrearPeriodo(
          empleado,
          fechaInicio,
        );
        if (fechaFin > fechaUtc(periodo.fechaFin)) {
          throw new BadRequestException(
            'La solicitud debe pertenecer a un solo periodo vacacional',
          );
        }
        if (fechaFin > fechaUtc(periodo.fechaLimiteDisfrute)) {
          throw new BadRequestException(
            'Las vacaciones deben disfrutarse dentro de los seis meses posteriores al aniversario',
          );
        }

        diasSolicitados = contarDiasLaborables(fechaInicio, fechaFin);
        if (diasSolicitados === 0) {
          throw new BadRequestException('El rango no contiene días laborables');
        }
        periodoVacacionalId = periodo.id;

        const solicitudesExistentes = await this.permisoRepository.find({
          where: {
            empleadoId: empleado.id,
            tipo: 'vacaciones',
            estatus: In(['pendiente', 'aprobada']),
          },
        });
        const traslapa = solicitudesExistentes.some(
          (solicitud) =>
            fechaInicio <= fechaUtc(solicitud.fechaFin) &&
            fechaFin >= fechaUtc(solicitud.fechaInicio),
        );
        if (traslapa) {
          throw new BadRequestException(
            'El rango de vacaciones se traslapa con otra solicitud',
          );
        }
      } else {
        fechaInicio = new Date(dto.fechaInicio);
        fechaFin = new Date(dto.fechaFin);
      }

      const data = this.permisoRepository.create({
        ...dto,
        empleadoId: empleado.id,
        fechaInicio,
        fechaFin,
        diasSolicitados,
        periodoVacacionalId,
      });
      return await this.permisoRepository.save(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarSolicitudesPermiso(
    paginacionDto: PaginacionDto,
    empleadoId?: string | null,
    estatus?: string,
  ) {
    const { registros = 10, pagina = 1 } = paginacionDto;
    const where: any = {};
    if (empleadoId) {
      const empleado = await this.empleadoRepository.findOne({
        where: { publicId: empleadoId },
      });
      if (!empleado)
        throw new BadRequestException(`El empleado ${empleadoId} no existe`);
      where.empleadoId = empleado.id;
    }
    if (estatus) where.estatus = estatus;
    const data = await this.permisoRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: {
        empleado: true,
        aprobador: true,
        periodoVacacional: true,
      },
      order: { id: 'DESC' },
    });
    const total = await this.permisoRepository.count({ where });
    return { total, data };
  }

  async actualizarComprobante(publicId: string, comprobante: string) {
    const solicitud = await this.permisoRepository.findOne({
      where: { publicId },
    });
    if (!solicitud)
      throw new BadRequestException(
        `La solicitud de permiso ${publicId} no existe`,
      );

    const anterior = solicitud.comprobante;
    await this.permisoRepository.update(solicitud.id, { comprobante });
    if (anterior && anterior !== comprobante) {
      this.uploadsService.eliminarImagen(anterior);
    }

    return { msg: 'Comprobante actualizado correctamente', comprobante };
  }

  async buscarSolicitudPermisoPorId(publicId: string) {
    const item = await this.permisoRepository.findOne({
      where: { publicId },
      relations: {
        empleado: true,
        aprobador: true,
        periodoVacacional: true,
      },
    });
    if (!item)
      throw new BadRequestException(
        `La solicitud de permiso ${publicId} no existe`,
      );
    return item;
  }

  async actualizarEstatusPermiso(
    publicId: string,
    dto: UpdateEstatusPermisoDto,
    usuarioId: number,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const permisoRepository = manager.getRepository(SolicitudPermiso);
      const periodoRepository = manager.getRepository(PeriodoVacacional);
      const solicitud = await permisoRepository.findOne({
        where: { publicId },
      });
      if (!solicitud)
        throw new BadRequestException(
          `La solicitud de permiso ${publicId} no existe`,
        );
      if (solicitud.estatus !== 'pendiente') {
        throw new BadRequestException(
          `La solicitud ya fue ${solicitud.estatus}, no se puede modificar`,
        );
      }

      if (dto.estatus === 'aprobada' && solicitud.tipo === 'vacaciones') {
        if (!solicitud.periodoVacacionalId || !solicitud.diasSolicitados) {
          throw new BadRequestException(
            'La solicitud de vacaciones no tiene un periodo válido',
          );
        }

        const periodo = await periodoRepository.findOne({
          where: { id: solicitud.periodoVacacionalId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!periodo)
          throw new BadRequestException('El periodo vacacional no existe');

        const solicitudes = await permisoRepository.find({
          where: {
            periodoVacacionalId: periodo.id,
            tipo: 'vacaciones',
            estatus: In(['pendiente', 'aprobada']),
          },
        });
        const diasAprobados = solicitudes
          .filter(
            (item) => item.estatus === 'aprobada' && item.id !== solicitud.id,
          )
          .reduce((total, item) => total + (item.diasSolicitados || 0), 0);
        const diasPendientes = solicitudes
          .filter(
            (item) => item.estatus === 'pendiente' && item.id !== solicitud.id,
          )
          .reduce((total, item) => total + (item.diasSolicitados || 0), 0);
        const disponibles =
          periodo.diasOtorgados - diasAprobados - diasPendientes;
        if (solicitud.diasSolicitados > disponibles) {
          throw new BadRequestException(
            `El saldo vacacional disponible es de ${disponibles} días`,
          );
        }

        await periodoRepository.update(periodo.id, {
          diasUsados: diasAprobados + solicitud.diasSolicitados,
        });
      }

      await permisoRepository.update(solicitud.id, {
        estatus: dto.estatus,
        aprobadoPor: usuarioId,
      });
      return {
        msg: `Solicitud ${dto.estatus === 'aprobada' ? 'aprobada' : 'rechazada'} exitosamente`,
      };
    });
  }
}
