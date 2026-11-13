import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Equipo } from './entities/equipo.entity';
import { PlanMantenimiento } from './entities/plan-mantenimiento.entity';
import { CreatePlanMantenimientoDto } from './dto/create-plan-mantenimiento.dto';
import { UpdatePlanMantenimientoDto } from './dto/update-plan-mantenimiento.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';

@Injectable()
export class PlanesMantenimientoService {
  constructor(
    @InjectRepository(Equipo)
    private readonly equipoRepository: Repository<Equipo>,
    @InjectRepository(PlanMantenimiento)
    private readonly planRepository: Repository<PlanMantenimiento>,
  ) {}

  async crearPlan(dto: CreatePlanMantenimientoDto) {
    try {
      const equipo = await this.equipoRepository.findOne({
        where: { publicId: dto.equipoId },
      });
      if (!equipo)
        throw new BadRequestException(`El equipo ${dto.equipoId} no existe`);
      const data = this.planRepository.create({
        ...dto,
        equipoId: equipo.id,
        fechaProximaEjecucion: dto.fechaProximaEjecucion
          ? new Date(dto.fechaProximaEjecucion)
          : undefined,
      });
      return await this.planRepository.save(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarPlanes() {
    return await this.planRepository.find({
      relations: {
        equipo: true,
      },
      order: { id: 'DESC' },
    });
  }

  async paginarPlanes(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) where.descripcion = ILike(`%${buscar}%`);
    const data = await this.planRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: {
        equipo: true,
      },
      order: { id: 'DESC' },
    });
    const total = await this.planRepository.count({ where });
    return { total, data };
  }

  async buscarPlanPorId(publicId: string) {
    const item = await this.planRepository.findOne({
      where: { publicId },
      relations: {
        equipo: true,
      },
    });
    if (!item)
      throw new BadRequestException(
        `El plan de mantenimiento ${publicId} no existe`,
      );
    return item;
  }

  async buscarPlanesPorEquipo(equipoId: string) {
    const equipo = await this.equipoRepository.findOne({
      where: { publicId: equipoId },
    });
    if (!equipo)
      throw new BadRequestException(`El equipo ${equipoId} no existe`);
    return await this.planRepository.find({
      where: { equipoId: equipo.id },
      relations: {
        equipo: true,
      },
      order: { id: 'DESC' },
    });
  }

  async actualizarPlan(publicId: string, dto: UpdatePlanMantenimientoDto) {
    const item = await this.planRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(
        `El plan de mantenimiento ${publicId} no existe`,
      );
    const { equipoId, ...resto } = dto;
    const updateData: any = { ...resto };
    if (equipoId !== undefined) {
      const equipo = await this.equipoRepository.findOne({
        where: { publicId: equipoId },
      });
      if (!equipo)
        throw new BadRequestException(`El equipo ${equipoId} no existe`);
      updateData.equipoId = equipo.id;
    }
    if (dto.fechaProximaEjecucion)
      updateData.fechaProximaEjecucion = new Date(dto.fechaProximaEjecucion);
    await this.planRepository.update(item.id, updateData);
    return { msg: 'Plan de mantenimiento actualizado exitosamente' };
  }

  async activarDesactivarPlan(publicId: string) {
    const item = await this.planRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(
        `El plan de mantenimiento ${publicId} no existe`,
      );
    await this.planRepository.update(item.id, { activo: !item.activo });
    return {
      msg: `Plan ${!item.activo ? 'activado' : 'desactivado'} correctamente`,
    };
  }
}
