import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { Equipo } from './entities/equipo.entity';
import { PlanMantenimiento } from './entities/plan-mantenimiento.entity';
import { OrdenTrabajo } from './entities/orden-trabajo.entity';
import { DetalleOrdenTrabajo } from './entities/detalle-orden-trabajo.entity';
import { CreateOrdenTrabajoDto } from './dto/create-orden-trabajo.dto';
import { UpdateEstatusOrdenDto } from './dto/update-estatus-orden.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { Empleado } from '../rh/entities/empleado.entity';

@Injectable()
export class OrdenesTrabajoService {
  constructor(
    @InjectRepository(Equipo)
    private readonly equipoRepository: Repository<Equipo>,
    @InjectRepository(PlanMantenimiento)
    private readonly planRepository: Repository<PlanMantenimiento>,
    @InjectRepository(OrdenTrabajo)
    private readonly ordenRepository: Repository<OrdenTrabajo>,
    @InjectRepository(DetalleOrdenTrabajo)
    private readonly detalleRepository: Repository<DetalleOrdenTrabajo>,
    private readonly dataSource: DataSource,
  ) {}

  private async generarFolio(): Promise<string> {
    const count = await this.ordenRepository.count();
    const fecha = new Date();
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    const secuencial = String(count + 1).padStart(4, '0');
    return `OT-${y}${m}${d}-${secuencial}`;
  }

  async crearOrden(dto: CreateOrdenTrabajoDto, usuarioId: number) {
    try {
      const equipo = await this.equipoRepository.findOne({
        where: { publicId: dto.equipoId },
      });
      if (!equipo)
        throw new BadRequestException(`El equipo ${dto.equipoId} no existe`);

      let planMantenimientoIdResolved: number | undefined = undefined;
      if (dto.planMantenimientoId !== undefined) {
        const plan = await this.planRepository.findOne({
          where: { publicId: dto.planMantenimientoId },
        });
        if (!plan)
          throw new BadRequestException(
            `El plan de mantenimiento ${dto.planMantenimientoId} no existe`,
          );
        planMantenimientoIdResolved = plan.id;
      }

      const folio = await this.generarFolio();
      let atendidoPorResolved: number | undefined = undefined;
      if (dto.atendidoPor) {
        const empleado = await this.dataSource
          .getRepository(Empleado)
          .findOne({ where: { publicId: dto.atendidoPor } });
        if (!empleado)
          throw new BadRequestException(
            `El empleado ${dto.atendidoPor} no existe`,
          );
        atendidoPorResolved = empleado.id;
      }

      const orden = this.ordenRepository.create({
        folio,
        equipoId: equipo.id,
        planMantenimientoId: planMantenimientoIdResolved,
        descripcion: dto.descripcion,
        fechaProgramada: new Date(dto.fechaProgramada),
        costo: dto.costo,
        observaciones: dto.observaciones,
        solicitadoPor: usuarioId,
        atendidoPor: atendidoPorResolved,
      });
      const ordenGuardada = await this.ordenRepository.save(orden);
      if (dto.detalles && dto.detalles.length > 0) {
        const detalles = dto.detalles.map((det) => ({
          ...det,
          ordenTrabajoId: ordenGuardada.id,
        }));
        await this.detalleRepository.save(detalles);
      }
      return await this.ordenRepository.findOne({
        where: { id: ordenGuardada.id },
        relations: {
          equipo: true,
          planMantenimiento: true,
          solicitante: true,
          atendido: true,
          detalles: true,
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarOrdenes() {
    return await this.ordenRepository.find({
      relations: {
        equipo: true,
        planMantenimiento: true,
        solicitante: true,
        atendido: true,
        detalles: true,
      },
      order: { id: 'DESC' },
    });
  }

  async paginarOrdenes(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) where.folio = ILike(`%${buscar}%`);
    const data = await this.ordenRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: {
        equipo: true,
        planMantenimiento: true,
        solicitante: true,
        atendido: true,
        detalles: true,
      },
      order: { id: 'DESC' },
    });
    const total = await this.ordenRepository.count({ where });
    return { total, data };
  }

  async buscarOrdenPorId(publicId: string) {
    const item = await this.ordenRepository.findOne({
      where: { publicId },
      relations: {
        equipo: true,
        planMantenimiento: true,
        solicitante: true,
        atendido: true,
        detalles: true,
      },
    });
    if (!item)
      throw new BadRequestException(
        `La orden de trabajo ${publicId} no existe`,
      );
    return item;
  }

  async buscarOrdenesPorEquipo(publicId: string) {
    const equipo = await this.equipoRepository.findOne({
      where: { publicId },
    });
    if (!equipo)
      throw new BadRequestException(`El equipo ${publicId} no existe`);
    return await this.ordenRepository.find({
      where: { equipoId: equipo.id },
      relations: {
        equipo: true,
        detalles: true,
      },
      order: { fechaProgramada: 'DESC' },
    });
  }

  async actualizarEstatusOrden(publicId: string, dto: UpdateEstatusOrdenDto) {
    const orden = await this.ordenRepository.findOne({ where: { publicId } });
    if (!orden)
      throw new BadRequestException(
        `La orden de trabajo ${publicId} no existe`,
      );

    const transiciones = {
      pendiente: ['en_progreso', 'cancelada'],
      en_progreso: ['completada', 'cancelada'],
      completada: [],
      cancelada: [],
    };
    if (!transiciones[orden.estatus]?.includes(dto.estatus)) {
      throw new BadRequestException(
        `No se puede cambiar de ${orden.estatus} a ${dto.estatus}`,
      );
    }

    const updateData: any = { estatus: dto.estatus };
    if (dto.estatus === 'completada') {
      updateData.fechaEjecucion = new Date();
      if (dto.costo !== undefined) updateData.costo = dto.costo;
    }
    if (dto.costo !== undefined) updateData.costo = dto.costo;
    if (dto.observaciones) updateData.observaciones = dto.observaciones;

    await this.ordenRepository.update(orden.id, updateData);
    return {
      msg: `Orden ${dto.estatus === 'completada' ? 'completada' : dto.estatus === 'cancelada' ? 'cancelada' : 'actualizada'} exitosamente`,
    };
  }
}
