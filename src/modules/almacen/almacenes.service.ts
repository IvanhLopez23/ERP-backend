import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Almacen } from './entities/almacen.entity';
import { CreateAlmacenDto } from './dto/create-almacen.dto';
import { UpdateAlmacenDto } from './dto/update-almacen.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';

@Injectable()
export class AlmacenesService {
  constructor(
    @InjectRepository(Almacen)
    private readonly almacenRepository: Repository<Almacen>,
  ) {}

  async crearAlmacen(dto: CreateAlmacenDto) {
    try {
      const existe = await this.almacenRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (existe) {
        throw new BadRequestException(`El almacén ${dto.nombre} ya existe`);
      }
      const data = this.almacenRepository.create(dto);
      return await this.almacenRepository.save(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarAlmacenes() {
    return await this.almacenRepository.find({ order: { id: 'DESC' } });
  }

  async paginarAlmacenes(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) {
      where.nombre = ILike(`%${buscar}%`);
    }
    const data = await this.almacenRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      order: { id: 'DESC' },
    });
    const total = await this.almacenRepository.count({ where });
    return { total, data };
  }

  async buscarAlmacenPorId(publicId: string) {
    const item = await this.almacenRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El almacén ${publicId} no existe`);
    return item;
  }

  async actualizarAlmacen(publicId: string, dto: UpdateAlmacenDto) {
    const item = await this.almacenRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El almacén ${publicId} no existe`);
    if (dto.nombre) {
      const duplicado = await this.almacenRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (duplicado && duplicado.id !== item.id) {
        throw new BadRequestException(`El almacén ${dto.nombre} ya existe`);
      }
    }
    await this.almacenRepository.update(item.id, dto);
    return { msg: 'Almacén actualizado exitosamente' };
  }

  async activarDesactivarAlmacen(publicId: string) {
    const item = await this.almacenRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El almacén ${publicId} no existe`);
    await this.almacenRepository.update(item.id, { activo: !item.activo });
    return {
      msg: `Almacén ${!item.activo ? 'activado' : 'desactivado'} correctamente`,
    };
  }
}
