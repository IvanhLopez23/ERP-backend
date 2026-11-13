import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Departamento } from './entities/departamento.entity';
import { Puesto } from './entities/puesto.entity';
import { CreatePuestoDto } from './dto/create-puesto.dto';
import { UpdatePuestoDto } from './dto/update-puesto.dto';
import { FiltrarPuestosDto } from './dto/filtrar-puestos.dto';

@Injectable()
export class PuestosService {
  constructor(
    @InjectRepository(Departamento)
    private readonly deptoRepository: Repository<Departamento>,
    @InjectRepository(Puesto)
    private readonly puestoRepository: Repository<Puesto>,
  ) {}

  async crearPuesto(dto: CreatePuestoDto) {
    try {
      const existe = await this.puestoRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (existe)
        throw new BadRequestException(`El puesto ${dto.nombre} ya existe`);

      let departamentoIdResolved: number | undefined = undefined;
      if (dto.departamentoId !== undefined) {
        const departamento = await this.deptoRepository.findOne({
          where: { publicId: dto.departamentoId },
        });
        if (!departamento)
          throw new BadRequestException(
            `El departamento ${dto.departamentoId} no existe`,
          );
        departamentoIdResolved = departamento.id;
      }

      const data = this.puestoRepository.create({
        ...dto,
        departamentoId: departamentoIdResolved,
      });
      return await this.puestoRepository.save(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarPuestos() {
    return await this.puestoRepository.find({
      relations: { departamento: true },
      order: { id: 'DESC' },
    });
  }

  async buscarDepartamentosActivos() {
    return this.deptoRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async buscarPuestosPorDepartamentoId(departamentoId: string) {
    const departamento = await this.deptoRepository.findOne({
      where: { publicId: departamentoId },
    });
    if (!departamento)
      throw new BadRequestException(
        `El departamento ${departamentoId} no existe`,
      );
    return this.puestoRepository.find({
      where: { departamentoId: departamento.id },
      order: { id: 'DESC' },
    });
  }

  async paginarPuestos(paginacionDto: FiltrarPuestosDto) {
    const {
      registros = 10,
      pagina = 1,
      buscar,
      departamentoId,
    } = paginacionDto;
    const where: any = {};
    if (buscar) where.nombre = ILike(`%${buscar}%`);
    if (departamentoId) {
      const departamento = await this.deptoRepository.findOne({
        where: { publicId: departamentoId },
      });
      if (!departamento) {
        throw new BadRequestException(
          `El departamento ${departamentoId} no existe`,
        );
      }
      where.departamentoId = departamento.id;
    }
    const data = await this.puestoRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: { departamento: true },
      order: { id: 'DESC' },
    });
    const total = await this.puestoRepository.count({
      where,
      relations: { departamento: true },
    });
    return { total, data };
  }

  async buscarPuestoPorId(publicId: string) {
    const item = await this.puestoRepository.findOne({
      where: { publicId },
      relations: { departamento: true },
    });
    if (!item) throw new BadRequestException(`El puesto ${publicId} no existe`);
    return item;
  }

  async actualizarPuesto(publicId: string, dto: UpdatePuestoDto) {
    const item = await this.puestoRepository.findOne({ where: { publicId } });
    if (!item) throw new BadRequestException(`El puesto ${publicId} no existe`);
    if (dto.nombre) {
      const dup = await this.puestoRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (dup && dup.id !== item.id)
        throw new BadRequestException(`El puesto ${dto.nombre} ya existe`);
    }
    const { departamentoId, ...resto } = dto;
    const updateData: any = { ...resto };
    if (departamentoId !== undefined) {
      const departamento = await this.deptoRepository.findOne({
        where: { publicId: departamentoId },
      });
      if (!departamento)
        throw new BadRequestException(
          `El departamento ${departamentoId} no existe`,
        );
      updateData.departamentoId = departamento.id;
    }
    await this.puestoRepository.update(item.id, updateData);
    return { msg: 'Puesto actualizado exitosamente' };
  }

  async activarDesactivarPuesto(publicId: string) {
    const item = await this.puestoRepository.findOne({ where: { publicId } });
    if (!item) throw new BadRequestException(`El puesto ${publicId} no existe`);
    await this.puestoRepository.update(item.id, { activo: !item.activo });
    return {
      msg: `Puesto ${!item.activo ? 'activado' : 'desactivado'} correctamente`,
    };
  }
}
