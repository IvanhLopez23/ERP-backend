import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { UnidadMedida } from './entities/unidad-medida.entity';
import { CreateUnidadMedidaDto } from './dto/create-unidad-medida.dto';
import { UpdateUnidadMedidaDto } from './dto/update-unidad-medida.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';

@Injectable()
export class UnidadesMedidaService {
  constructor(
    @InjectRepository(UnidadMedida)
    private readonly unidadMedidaRepository: Repository<UnidadMedida>,
  ) {}

  async crearUnidadMedida(dto: CreateUnidadMedidaDto) {
    try {
      const existe = await this.unidadMedidaRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (existe) {
        throw new BadRequestException(
          `La unidad de medida ${dto.nombre} ya existe`,
        );
      }
      const data = this.unidadMedidaRepository.create(dto);
      return await this.unidadMedidaRepository.save(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarUnidadesMedida() {
    return await this.unidadMedidaRepository.find({ order: { id: 'DESC' } });
  }

  async paginarUnidadesMedida(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) {
      where.nombre = ILike(`%${buscar}%`);
    }
    const data = await this.unidadMedidaRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      order: { id: 'DESC' },
    });
    const total = await this.unidadMedidaRepository.count({ where });
    return { total, data };
  }

  async buscarUnidadMedidaPorId(publicId: string) {
    const item = await this.unidadMedidaRepository.findOne({
      where: { publicId },
    });
    if (!item)
      throw new BadRequestException(
        `La unidad de medida ${publicId} no existe`,
      );
    return item;
  }

  async actualizarUnidadMedida(publicId: string, dto: UpdateUnidadMedidaDto) {
    const item = await this.unidadMedidaRepository.findOne({
      where: { publicId },
    });
    if (!item)
      throw new BadRequestException(
        `La unidad de medida ${publicId} no existe`,
      );
    if (dto.nombre) {
      const duplicado = await this.unidadMedidaRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (duplicado && duplicado.id !== item.id) {
        throw new BadRequestException(
          `La unidad de medida ${dto.nombre} ya existe`,
        );
      }
    }
    await this.unidadMedidaRepository.update(item.id, dto);
    return { msg: 'Unidad de medida actualizada exitosamente' };
  }

  async activarDesactivarUnidadMedida(publicId: string) {
    const item = await this.unidadMedidaRepository.findOne({
      where: { publicId },
    });
    if (!item)
      throw new BadRequestException(
        `La unidad de medida ${publicId} no existe`,
      );
    await this.unidadMedidaRepository.update(item.id, { activo: !item.activo });
    return {
      msg: `Unidad de medida ${!item.activo ? 'activada' : 'desactivada'} correctamente`,
    };
  }
}
