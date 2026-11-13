import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Departamento } from './entities/departamento.entity';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';

@Injectable()
export class DepartamentosService {
  constructor(
    @InjectRepository(Departamento)
    private readonly deptoRepository: Repository<Departamento>,
  ) {}

  async crearDepartamento(dto: CreateDepartamentoDto) {
    try {
      const existe = await this.deptoRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (existe)
        throw new BadRequestException(
          `El departamento ${dto.nombre} ya existe`,
        );
      const data = this.deptoRepository.create(dto);
      return await this.deptoRepository.save(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarDepartamentos() {
    return await this.deptoRepository.find({ order: { id: 'DESC' } });
  }

  async paginarDepartamentos(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where: any = {};
    if (buscar) where.nombre = ILike(`%${buscar}%`);
    const data = await this.deptoRepository.find({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      order: { id: 'DESC' },
    });
    const total = await this.deptoRepository.count({ where });
    return { total, data };
  }

  async buscarDepartamentoPorId(publicId: string) {
    const item = await this.deptoRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El departamento ${publicId} no existe`);
    return item;
  }

  async actualizarDepartamento(publicId: string, dto: UpdateDepartamentoDto) {
    const item = await this.deptoRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El departamento ${publicId} no existe`);
    if (dto.nombre) {
      const dup = await this.deptoRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (dup && dup.id !== item.id)
        throw new BadRequestException(
          `El departamento ${dto.nombre} ya existe`,
        );
    }
    await this.deptoRepository.update(item.id, dto);
    return { msg: 'Departamento actualizado exitosamente' };
  }

  async activarDesactivarDepartamento(publicId: string) {
    const item = await this.deptoRepository.findOne({ where: { publicId } });
    if (!item)
      throw new BadRequestException(`El departamento ${publicId} no existe`);
    await this.deptoRepository.update(item.id, { activo: !item.activo });
    return {
      msg: `Departamento ${!item.activo ? 'activado' : 'desactivado'} correctamente`,
    };
  }
}
