import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { CategoriaProducto } from './entities/categoria-producto.entity';
import { UnidadMedida } from './entities/unidad-medida.entity';
import { Producto } from './entities/producto.entity';
import { Inventario } from './entities/inventario.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(CategoriaProducto)
    private readonly categoriaRepository: Repository<CategoriaProducto>,
    @InjectRepository(UnidadMedida)
    private readonly unidadMedidaRepository: Repository<UnidadMedida>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    private readonly uploadsService: UploadsService,
  ) {}

  /** Catálogo completo de categorías para el formulario de productos. */
  async listarCategorias() {
    return await this.categoriaRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async crearProducto(dto: CreateProductoDto) {    try {
      const existe = await this.productoRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (existe) {
        throw new BadRequestException(
          `El producto con código ${dto.codigo} ya existe`,
        );
      }
      let categoriaIdResolved: number | undefined = undefined;
      if (dto.categoriaId !== undefined && dto.categoriaId !== null) {
        const cat = await this.categoriaRepository.findOne({
          where: { publicId: dto.categoriaId },
        });
        if (!cat)
          throw new BadRequestException(
            `La categoría ${dto.categoriaId} no existe`,
          );
        categoriaIdResolved = cat.id;
      }
      const um = await this.unidadMedidaRepository.findOne({
        where: { publicId: dto.unidadMedidaId },
      });
      if (!um)
        throw new BadRequestException(
          `La unidad de medida ${dto.unidadMedidaId} no existe`,
        );
      const data = this.productoRepository.create({
        ...dto,
        unidadMedidaId: um.id,
        categoriaId: categoriaIdResolved,
      });
      const guardado = await this.productoRepository.save(data);
      return await this.productoRepository.findOne({
        where: { id: guardado.id },
        relations: { unidadMedida: true, categoria: true },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarProductos() {
    const productos = await this.productoRepository.find({
      relations: { unidadMedida: true, categoria: true },
      order: { id: 'DESC' },
    });
    return await this.conExistencias(productos);
  }

  async paginarProductos(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) {
      where.nombre = ILike(`%${buscar}%`);
    }
    const [data, total] = await this.productoRepository.findAndCount({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: { unidadMedida: true, categoria: true },
      order: { id: 'DESC' },
    });
    return { total, data: await this.conExistencias(data) };
  }

  async buscarProductoPorId(publicId: string) {
    const item = await this.productoRepository.findOne({
      where: { publicId },
      relations: { unidadMedida: true, categoria: true },
    });
    if (!item)
      throw new BadRequestException(`El producto ${publicId} no existe`);
    const [conExistencia] = await this.conExistencias([item]);
    return conExistencia;
  }

  /**
   * Agrega la existencia total del producto sumando todos los almacenes.
   */
  private async conExistencias(productos: Producto[]) {
    if (productos.length === 0) return [];

    const existencias = await this.inventarioRepository.find({
      where: { productoId: In(productos.map((producto) => producto.id)) },
      relations: { producto: true },
    });

    const mapa = new Map<number, number>();
    for (const fila of existencias) {
      const id = fila.producto?.id;
      if (!id) continue;
      mapa.set(id, (mapa.get(id) ?? 0) + Number(fila.existencia));
    }

    return productos.map((producto) => ({
      ...producto,
      existencias: mapa.get(producto.id) ?? 0,
    }));
  }

  async actualizarProducto(publicId: string, dto: UpdateProductoDto) {
    const item = await this.productoRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El producto ${publicId} no existe`);
    if (dto.codigo) {
      const duplicado = await this.productoRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (duplicado && duplicado.id !== item.id) {
        throw new BadRequestException(`El código ${dto.codigo} ya está en uso`);
      }
    }
    const { unidadMedidaId, categoriaId, ...resto } = dto;
    const updateData: any = { ...resto };
    if (unidadMedidaId !== undefined) {
      const um = await this.unidadMedidaRepository.findOne({
        where: { publicId: unidadMedidaId },
      });
      if (!um)
        throw new BadRequestException(
          `La unidad de medida ${unidadMedidaId} no existe`,
        );
      updateData.unidadMedidaId = um.id;
    }
    if (categoriaId !== undefined) {
      if (categoriaId === null) {
        updateData.categoriaId = null;
      } else {
        const cat = await this.categoriaRepository.findOne({
          where: { publicId: categoriaId },
        });
        if (!cat)
          throw new BadRequestException(
            `La categoría ${categoriaId} no existe`,
          );
        updateData.categoriaId = cat.id;
      }
    }
    for (const key of Object.keys(updateData)) {
      if (updateData[key] === undefined) delete updateData[key];
    }
    if (Object.keys(updateData).length === 0) {
      return { msg: 'Sin cambios para actualizar' };
    }
    await this.productoRepository.update(item.id, updateData);
    this.eliminarFotoAnterior(item.foto, dto.foto);
    return { msg: 'Producto actualizado exitosamente' };
  }

  /**
   * Borra la foto anterior solo si se reemplazó por una nueva gestionada
   * por /uploads. Nunca debe romper la respuesta; es mejor esfuerzo.
   */
  private eliminarFotoAnterior(fotoAnterior?: string, fotoNueva?: string) {
    if (
      fotoAnterior &&
      fotoAnterior.startsWith('/uploads/') &&
      fotoNueva &&
      fotoNueva !== fotoAnterior
    ) {
      try {
        this.uploadsService.eliminarImagen(fotoAnterior);
      } catch {
        // Mejor esfuerzo.
      }
    }
  }

  async activarDesactivarProducto(publicId: string) {
    const item = await this.productoRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El producto ${publicId} no existe`);
    await this.productoRepository.update(item.id, { activo: !item.activo });
    return {
      msg: `Producto ${!item.activo ? 'activado' : 'desactivado'} correctamente`,
    };
  }
}
