import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { CentroCosto } from './entities/centro-costo.entity';
import { CreateCentroCostoDto } from './dto/create-centro-costo.dto';
import {
  CentrosCostoQueryDto,
  UpdateCentroCostoDto,
} from './dto/update-centro-costo.dto';

@Injectable()
export class CentrosCostoService {
  constructor(
    @InjectRepository(CentroCosto)
    private readonly centroRepository: Repository<CentroCosto>,
  ) {}

  async crear(dto: CreateCentroCostoDto, usuarioId: number) {
    const existe = await this.centroRepository.findOne({
      where: { codigo: dto.codigo },
    });
    if (existe) {
      throw new BadRequestException(
        `El centro de costo ${dto.codigo} ya existe`,
      );
    }

    return this.centroRepository.save(
      this.centroRepository.create({
        codigo: dto.codigo,
        nombre: dto.nombre,
        tipo: dto.tipo ?? 'centro_costo',
        descripcion: dto.descripcion ?? null,
        activo: dto.activo ?? true,
        usuarioId,
      }),
    );
  }

  async buscar(query: CentrosCostoQueryDto) {
    const where: FindOptionsWhere<CentroCosto> = {};
    if (query.tipo) where.tipo = query.tipo;
    if (query.activo !== undefined) where.activo = query.activo;

    const whereFinal:
      FindOptionsWhere<CentroCosto> | FindOptionsWhere<CentroCosto>[] =
      query.buscar
        ? [
            { ...where, codigo: ILike(`%${query.buscar}%`) },
            { ...where, nombre: ILike(`%${query.buscar}%`) },
          ]
        : where;

    return this.centroRepository.find({
      where: whereFinal,
      order: { codigo: 'ASC' },
    });
  }

  async buscarPorId(publicId: string) {
    const item = await this.centroRepository.findOne({
      where: { publicId },
    });
    if (!item) {
      throw new BadRequestException(`El centro de costo ${publicId} no existe`);
    }
    return item;
  }

  async actualizar(publicId: string, dto: UpdateCentroCostoDto) {
    const item = await this.buscarPorId(publicId);
    if (dto.codigo && dto.codigo !== item.codigo) {
      const duplicado = await this.centroRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (duplicado) {
        throw new BadRequestException(`El código ${dto.codigo} ya está en uso`);
      }
    }

    await this.centroRepository.update(item.id, {
      codigo: dto.codigo ?? item.codigo,
      nombre: dto.nombre ?? item.nombre,
      tipo: dto.tipo ?? item.tipo,
      descripcion:
        dto.descripcion !== undefined
          ? (dto.descripcion ?? null)
          : item.descripcion,
      activo: dto.activo ?? item.activo,
      fechaActualizacion: new Date(),
    });

    return { msg: 'Centro de costo actualizado exitosamente' };
  }

  async activarDesactivar(publicId: string) {
    const item = await this.buscarPorId(publicId);
    await this.centroRepository.update(item.id, {
      activo: !item.activo,
      fechaActualizacion: new Date(),
    });
    return {
      msg: `Centro de costo ${!item.activo ? 'activado' : 'desactivado'} correctamente`,
    };
  }
}
