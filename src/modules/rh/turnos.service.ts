import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Turno } from './entities/turno.entity';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';

@Injectable()
export class TurnosService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
  ) {}

  async crear(dto: CreateTurnoDto) {
    const existe = await this.turnoRepository.findOne({
      where: { nombre: dto.nombre },
    });
    if (existe) {
      throw new BadRequestException(`El turno ${dto.nombre} ya existe`);
    }
    return this.turnoRepository.save(this.turnoRepository.create(dto));
  }

  async buscar() {
    return this.turnoRepository.find({ order: { nombre: 'ASC' } });
  }

  async paginar(paginacionDto: PaginacionDto) {
    const { registros = 10, pagina = 1, buscar } = paginacionDto;
    const where = buscar ? { nombre: ILike(`%${buscar}%`) } : {};
    const [data, total] = await this.turnoRepository.findAndCount({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      order: { nombre: 'ASC' },
    });
    return { total, data };
  }

  async buscarPorId(publicId: string) {
    const turno = await this.turnoRepository.findOne({ where: { publicId } });
    if (!turno) {
      throw new BadRequestException(`El turno ${publicId} no existe`);
    }
    return turno;
  }

  async actualizar(publicId: string, dto: UpdateTurnoDto) {
    const turno = await this.buscarPorId(publicId);

    if (dto.nombre) {
      const duplicado = await this.turnoRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (duplicado && duplicado.id !== turno.id) {
        throw new BadRequestException(`El turno ${dto.nombre} ya existe`);
      }
    }

    await this.turnoRepository.update(turno.id, dto);
    return { msg: 'Turno actualizado exitosamente' };
  }

  async activarDesactivar(publicId: string) {
    const turno = await this.buscarPorId(publicId);
    await this.turnoRepository.update(turno.id, { activo: !turno.activo });
    return {
      msg: `Turno ${!turno.activo ? 'activado' : 'desactivado'} correctamente`,
    };
  }
}
