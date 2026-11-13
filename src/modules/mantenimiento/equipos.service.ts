import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Equipo } from './entities/equipo.entity';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';

@Injectable()
export class EquiposService {
  constructor(
    @InjectRepository(Equipo)
    private readonly equipoRepository: Repository<Equipo>,
  ) {}

  async crearEquipo(dto: CreateEquipoDto) {
    try {
      const existe = await this.equipoRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (existe)
        throw new BadRequestException(
          `El equipo con código ${dto.codigo} ya existe`,
        );
      const data = this.equipoRepository.create({
        ...dto,
        fechaAdquisicion: dto.fechaAdquisicion
          ? new Date(dto.fechaAdquisicion)
          : undefined,
      });
      return await this.equipoRepository.save(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarEquipos() {
    return await this.equipoRepository.find({ order: { id: 'DESC' } });
  }

  async paginarEquipos(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) where.nombre = ILike(`%${buscar}%`);
    const data = await this.equipoRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      order: { id: 'DESC' },
    });
    const total = await this.equipoRepository.count({ where });
    return { total, data };
  }

  async buscarEquipoPorId(publicId: string) {
    const item = await this.equipoRepository.findOne({
      where: { publicId },
      relations: {
        planes: true,
      },
    });
    if (!item) throw new BadRequestException(`El equipo ${publicId} no existe`);
    return item;
  }

  async buscarEquiposPorEstado(estado: string) {
    return await this.equipoRepository.find({
      where: { estado },
      order: { id: 'DESC' },
    });
  }

  async actualizarEquipo(publicId: string, dto: UpdateEquipoDto) {
    const item = await this.equipoRepository.findOne({ where: { publicId } });
    if (!item) throw new BadRequestException(`El equipo ${publicId} no existe`);
    if (dto.codigo) {
      const dup = await this.equipoRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (dup && dup.id !== item.id)
        throw new BadRequestException(`El código ${dto.codigo} ya está en uso`);
    }
    const updateData: any = { ...dto };
    if (dto.fechaAdquisicion)
      updateData.fechaAdquisicion = new Date(dto.fechaAdquisicion);
    await this.equipoRepository.update(item.id, updateData);
    return { msg: 'Equipo actualizado exitosamente' };
  }

  async activarDesactivarEquipo(publicId: string) {
    const item = await this.equipoRepository.findOne({ where: { publicId } });
    if (!item) throw new BadRequestException(`El equipo ${publicId} no existe`);
    await this.equipoRepository.update(item.id, { activo: !item.activo });
    return {
      msg: `Equipo ${!item.activo ? 'activado' : 'desactivado'} correctamente`,
    };
  }
}
