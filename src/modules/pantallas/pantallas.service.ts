import { Injectable } from '@nestjs/common';
import { CreatePantallaDto } from './dto/create-pantalla.dto';
import { UpdatePantallaDto } from './dto/update-pantalla.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull } from 'typeorm';
import { Pantalla } from './entities/pantalla.entity';
import { Roles } from '../roles/entities/role.entity';
import { BadRequestException } from '@nestjs/common';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';

@Injectable()
export class PantallasService {
  constructor(
    @InjectRepository(Pantalla)
    private readonly pantallasRepository: Repository<Pantalla>,
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
  ) {}

  async crear(createPantallaDto: CreatePantallaDto) {
    try {
      const existePantalla = await this.pantallasRepository.findOne({
        where: { nombre: createPantallaDto.nombre },
      });
      if (existePantalla) {
        throw new BadRequestException(
          `La pantalla ${createPantallaDto.nombre} ya existe`,
        );
      }

      const { padreId, ...datos } = createPantallaDto;
      let padreIdResolved: number | undefined = undefined;
      if (padreId !== undefined) {
        const padre = await this.pantallasRepository.findOne({
          where: { publicId: padreId },
        });
        if (!padre)
          throw new BadRequestException(
            `La pantalla padre ${padreId} no existe`,
          );
        padreIdResolved = padre.id;
      }

      const pantalla = this.pantallasRepository.create({
        ...datos,
        padreId: padreIdResolved,
      });
      const data = await this.pantallasRepository.save(pantalla);
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscar() {
    try {
      const pantalla = await this.pantallasRepository.find();
      return pantalla;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async paginado(paginacionDto: PaginacionDto) {
    try {
      const { registros = 10, pagina = 1, buscar } = paginacionDto;
      let where: any = {};

      if (buscar) {
        where = [
          { nombre: ILike(`%${buscar}%`) },
          { ruta: ILike(`%${buscar}%`) },
        ];
      }

      const data = await this.pantallasRepository.find({
        take: registros,
        skip: (pagina - 1) * registros,
        where,
        order: {
          id: 'DESC',
        },
      });

      const total = await this.pantallasRepository.count({ where });
      return { total, data };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarPorId(publicId: string) {
    try {
      const pantalla = await this.pantallasRepository.findOne({
        where: { publicId },
      });
      if (!pantalla) {
        throw new BadRequestException(`La pantalla ${publicId} no existe`);
      }
      return pantalla;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async actualizar(publicId: string, updatePantallaDto: UpdatePantallaDto) {
    try {
      const pantalla = await this.pantallasRepository.findOne({
        where: { publicId },
      });
      if (!pantalla) {
        throw new BadRequestException(`La pantalla ${publicId} no existe`);
      }
      const existePantalla = await this.pantallasRepository.findOne({
        where: { nombre: updatePantallaDto.nombre },
      });
      if (existePantalla) {
        throw new BadRequestException(
          `La pantalla ${updatePantallaDto.nombre} ya existe`,
        );
      }

      const { padreId, ...resto } = updatePantallaDto;
      const updateData: any = { ...resto };
      if (padreId !== undefined) {
        const padre = await this.pantallasRepository.findOne({
          where: { publicId: padreId },
        });
        if (!padre)
          throw new BadRequestException(
            `La pantalla padre ${padreId} no existe`,
          );
        updateData.padreId = padre.id;
      }

      await this.pantallasRepository.update(pantalla.id, updateData);
      return { msg: 'Pantalla actualizada exitosamente' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async eliminar(publicId: string) {
    try {
      const pantalla = await this.pantallasRepository.findOne({
        where: { publicId },
      });
      if (!pantalla) {
        throw new BadRequestException(`La pantalla ${publicId} no existe`);
      }
      await this.pantallasRepository.remove(pantalla);
      return { msg: 'Pantalla eliminada exitosamente' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async actualizarActivo(publicId: string) {
    try {
      const pantalla = await this.pantallasRepository.findOne({
        where: { publicId },
      });
      if (!pantalla) {
        throw new BadRequestException(`La pantalla ${publicId} no existe`);
      }
      await this.pantallasRepository.update(pantalla.id, {
        activo: !pantalla.activo,
      });
      return {
        msg: `Pantalla ${!pantalla.activo ? 'activado' : 'desactivado'} correctamente`,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarPorRolId(rolId: string) {
    const rol = await this.rolesRepository.findOne({
      where: { publicId: rolId },
    });
    if (!rol) {
      throw new BadRequestException(`El rol ${rolId} no existe`);
    }
    try {
      const pantalla = await this.pantallasRepository.find({
        where: { permisos: { rol: { id: rol.id } } },
        relations: { permisos: true },
        order: {
          id: 'ASC',
        },
      });
      return pantalla;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarPorPadres() {
    try {
      const pantalla = await this.pantallasRepository.find({
        where: { padreId: IsNull() },
        order: {
          id: 'ASC',
        },
      });
      return pantalla;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
