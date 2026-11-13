import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Refaccion } from './entities/refaccion.entity';
import { CreateRefaccionDto } from './dto/create-refaccion.dto';
import { UpdateRefaccionDto } from './dto/update-refaccion.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { ProductosService } from '../almacen/productos.service';

@Injectable()
export class RefaccionesService {
  constructor(
    @InjectRepository(Refaccion)
    private readonly refaccionRepository: Repository<Refaccion>,
    private readonly productosService: ProductosService,
  ) {}

  async crearRefaccion(dto: CreateRefaccionDto) {
    try {
      const existe = await this.refaccionRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (existe)
        throw new BadRequestException(
          `La refacción con código ${dto.codigo} ya existe`,
        );

      let productoIdResolved: number | undefined = undefined;
      if (dto.productoId !== undefined) {
        const producto = await this.productosService.buscarProductoPorId(
          dto.productoId,
        );
        productoIdResolved = producto.id;
      }

      const data = this.refaccionRepository.create({
        ...dto,
        productoId: productoIdResolved,
      });
      return await this.refaccionRepository.save(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarRefacciones() {
    return await this.refaccionRepository.find({ order: { id: 'DESC' } });
  }

  async paginarRefacciones(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) where.nombre = ILike(`%${buscar}%`);
    const data = await this.refaccionRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      order: { id: 'DESC' },
    });
    const total = await this.refaccionRepository.count({ where });
    return { total, data };
  }

  async buscarRefaccionPorId(publicId: string) {
    const item = await this.refaccionRepository.findOne({
      where: { publicId },
    });
    if (!item)
      throw new BadRequestException(`La refacción ${publicId} no existe`);
    return item;
  }

  async buscarRefaccionesBajoStock() {
    return await this.refaccionRepository.find({
      where: { activo: true },
      order: { stockMinimo: 'ASC' },
    });
  }

  async actualizarRefaccion(publicId: string, dto: UpdateRefaccionDto) {
    const item = await this.refaccionRepository.findOne({
      where: { publicId },
    });
    if (!item)
      throw new BadRequestException(`La refacción ${publicId} no existe`);
    if (dto.codigo) {
      const dup = await this.refaccionRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (dup && dup.id !== item.id)
        throw new BadRequestException(`El código ${dto.codigo} ya está en uso`);
    }
    const { productoId, ...resto } = dto;
    const updateData: any = { ...resto };
    if (productoId !== undefined) {
      const producto =
        await this.productosService.buscarProductoPorId(productoId);
      updateData.productoId = producto.id;
    }
    await this.refaccionRepository.update(item.id, updateData);
    return { msg: 'Refacción actualizada exitosamente' };
  }

  async activarDesactivarRefaccion(publicId: string) {
    const item = await this.refaccionRepository.findOne({
      where: { publicId },
    });
    if (!item)
      throw new BadRequestException(`La refacción ${publicId} no existe`);
    await this.refaccionRepository.update(item.id, { activo: !item.activo });
    return {
      msg: `Refacción ${!item.activo ? 'activada' : 'desactivada'} correctamente`,
    };
  }
}
