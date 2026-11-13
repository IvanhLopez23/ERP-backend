import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles } from './entities/role.entity';
import { ILike, In, Repository } from 'typeorm';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { Permiso } from 'src/modules/permisos/entities/permiso.entity';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
    @InjectRepository(Permiso)
    private readonly permisoRepository: Repository<Permiso>,
  ) {}

  async onModuleInit() {
    await this.rolesRepository.update(
      { descripcion: In(['AdministraGOG', 'Administrador']) },
      { esAdministrador: true },
    );
  }

  async crear(createRoleDto: CreateRoleDto) {
    try {
      const existeRol = await this.rolesRepository.findOne({
        where: { descripcion: createRoleDto.descripcion },
      });
      if (existeRol) {
        throw new BadRequestException(
          `El rol ${createRoleDto.descripcion} ya existe`,
        );
      }
      const rol = this.rolesRepository.create(createRoleDto);
      const data = await this.rolesRepository.save(rol);
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscar() {
    try {
      const roles = await this.rolesRepository.find();
      return roles;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async paginado(paginacionDto: PaginacionDto) {
    try {
      const { registros = 10, pagina = 1, buscar } = paginacionDto;
      const where: any = {};

      if (buscar) {
        where.descripcion = ILike(`%${buscar}%`);
      }

      const data = await this.rolesRepository.find({
        take: registros,
        skip: (pagina - 1) * registros,
        where,
        order: {
          id: 'DESC',
        },
      });

      const total = await this.rolesRepository.count({ where });
      return { total, data };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarPorId(publicId: string) {
    try {
      const rol = await this.rolesRepository.findOne({
        where: { publicId },
      });
      if (!rol) {
        throw new BadRequestException(`El rol ${publicId} no existe`);
      }
      return rol;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarPorPublicId(publicId: string) {
    const rol = await this.rolesRepository.findOne({
      where: { publicId },
      relations: { permisos: true },
    });
    if (!rol) {
      throw new BadRequestException(`El rol ${publicId} no existe`);
    }
    return rol;
  }

  async buscarPorIdInterno(id: number) {
    return this.rolesRepository.findOne({ where: { id } });
  }

  async actualizar(publicId: string, updateRoleDto: UpdateRoleDto) {
    try {
      const rol = await this.rolesRepository.findOne({ where: { publicId } });
      if (!rol) {
        throw new BadRequestException(`El rol ${publicId} no existe`);
      }
      const existeRol = await this.rolesRepository.findOne({
        where: { descripcion: updateRoleDto.descripcion },
      });
      if (existeRol) {
        throw new BadRequestException(
          `El rol ${updateRoleDto.descripcion} ya existe`,
        );
      }
      await this.rolesRepository.update(rol.id, updateRoleDto);
      return { msg: 'Rol actualizado exitosamente' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async actualizarActivo(publicId: string) {
    try {
      const rol = await this.rolesRepository.findOne({
        where: { publicId },
      });
      if (!rol) {
        throw new BadRequestException(`El rol ${publicId} no existe`);
      }
      await this.rolesRepository.update(rol.id, {
        activo: !rol.activo,
      });
      return {
        msg: `Rol ${!rol.activo ? 'activado' : 'desactivado'} correctamente`,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
