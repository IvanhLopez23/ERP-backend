import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CategoriaProducto } from './entities/categoria-producto.entity';
import { CreateCategoriaProductoDto } from './dto/create-categoria-producto.dto';
import { UpdateCategoriaProductoDto } from './dto/update-categoria-producto.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(CategoriaProducto)
    private readonly categoriaRepository: Repository<CategoriaProducto>,
  ) {}

  async crearCategoria(dto: CreateCategoriaProductoDto) {
    try {
      const existe = await this.categoriaRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (existe) {
        throw new BadRequestException(`La categoría ${dto.nombre} ya existe`);
      }
      let padreIdResolved: number | undefined = undefined;
      if (dto.padreId !== undefined && dto.padreId !== null) {
        const padre = await this.categoriaRepository.findOne({
          where: { publicId: dto.padreId },
        });
        if (!padre)
          throw new BadRequestException(
            `La categoría padre ${dto.padreId} no existe`,
          );
        padreIdResolved = padre.id;
      }
      const data = this.categoriaRepository.create({
        ...dto,
        padreId: padreIdResolved,
      });
      return await this.categoriaRepository.save(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarCategorias() {
    return await this.categoriaRepository.find({
      relations: { subcategorias: true },
      order: { id: 'DESC' },
    });
  }

  async paginarCategorias(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) {
      where.nombre = ILike(`%${buscar}%`);
    }
    const data = await this.categoriaRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: { padre: true },
      order: { id: 'DESC' },
    });
    const total = await this.categoriaRepository.count({ where });
    return { total, data };
  }

  async buscarCategoriaPorId(publicId: string) {
    const item = await this.categoriaRepository.findOne({
      where: { publicId },
      relations: { padre: true, subcategorias: true },
    });
    if (!item)
      throw new BadRequestException(`La categoría ${publicId} no existe`);
    return item;
  }

  async actualizarCategoria(publicId: string, dto: UpdateCategoriaProductoDto) {
    const item = await this.categoriaRepository.findOne({
      where: { publicId },
    });
    if (!item)
      throw new BadRequestException(`La categoría ${publicId} no existe`);
    if (dto.nombre) {
      const duplicado = await this.categoriaRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (duplicado && duplicado.id !== item.id) {
        throw new BadRequestException(`La categoría ${dto.nombre} ya existe`);
      }
    }
    const { padreId, ...resto } = dto;
    const updateData: any = { ...resto };
    if (padreId !== undefined) {
      const padre = await this.categoriaRepository.findOne({
        where: { publicId: padreId },
      });
      if (!padre)
        throw new BadRequestException(
          `La categoría padre ${padreId} no existe`,
        );
      if (padre.id === item.id) {
        throw new BadRequestException(
          'Una categoría no puede ser padre de sí misma',
        );
      }
      updateData.padreId = padre.id;
    }
    await this.categoriaRepository.update(item.id, updateData);
    return { msg: 'Categoría actualizada exitosamente' };
  }

  async activarDesactivarCategoria(publicId: string) {
    const item = await this.categoriaRepository.findOne({
      where: { publicId },
    });
    if (!item)
      throw new BadRequestException(`La categoría ${publicId} no existe`);
    await this.categoriaRepository.update(item.id, { activo: !item.activo });
    return {
      msg: `Categoría ${!item.activo ? 'activada' : 'desactivada'} correctamente`,
    };
  }
}
