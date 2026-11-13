import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { CrearPermisoFullDto } from './dto/crear-permisos-full.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Permiso } from './entities/permiso.entity';
import { Pantalla } from '../pantallas/entities/pantalla.entity';
import { ActualizarPermisosRolDto } from './dto/actualizar-permisos-rol.dto';
import { Roles } from '../roles/entities/role.entity';
import { Usuarios } from '../usuarios/entities/usuario.entity';

@Injectable()
export class PermisosService {
  constructor(
    @InjectRepository(Permiso)
    private readonly permisosRepository: Repository<Permiso>,
    @InjectRepository(Pantalla)
    private readonly pantallasRepository: Repository<Pantalla>,
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
    private readonly dataSource: DataSource,
  ) {}

  async crearPermisos(createPermisoDto: CreatePermisoDto) {
    try {
      const { usuarioId, pantallaId, rolId, ...datos } = createPermisoDto;

      const pantalla = await this.pantallasRepository.findOne({
        where: { publicId: pantallaId, activo: true },
      });
      if (!pantalla)
        throw new BadRequestException(`La pantalla ${pantallaId} no existe`);

      const rol = await this.rolesRepository.findOne({
        where: { publicId: rolId, activo: true },
      });
      if (!rol) throw new BadRequestException(`El rol ${rolId} no existe`);

      let usuarioIdResolved: number | undefined = undefined;
      if (usuarioId !== undefined) {
        const usuario = await this.dataSource
          .getRepository(Usuarios)
          .findOne({ where: { publicId: usuarioId } });
        if (!usuario)
          throw new BadRequestException(`El usuario ${usuarioId} no existe`);
        usuarioIdResolved = usuario.id;
      }

      const data = {
        ...datos,
        pantallaId: pantalla.id,
        rolId: rol.id,
        usuarioId: usuarioIdResolved,
      };

      const existente = await this.permisosRepository.findOne({
        where: { rolId: rol.id, pantallaId: pantalla.id },
      });
      if (existente) {
        await this.permisosRepository.update(existente.id, data);
        return this.permisosRepository.findOne({ where: { id: existente.id } });
      }

      return await this.permisosRepository.save(
        this.permisosRepository.create(data),
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async crearPermisosFull(
    payload: CrearPermisoFullDto | CrearPermisoFullDto[],
    usuarioId: number,
  ) {
    try {
      const items = Array.isArray(payload) ? payload : [payload];
      if (!items.length)
        throw new BadRequestException('Debe enviar al menos un rol');
      const permisos: Permiso[] = [];
      const roles = new Set<number>();

      for (const item of items) {
        const rol = await this.rolesRepository.findOne({
          where: { publicId: item.rolPublicId, activo: true },
        });
        if (!rol)
          throw new BadRequestException(`El rol ${item.rolPublicId} no existe`);
        roles.add(rol.id);

        for (const pantalla of item.pantallas) {
          const pant = await this.pantallasRepository.findOne({
            where: { publicId: pantalla.pantallaPublicId, activo: true },
          });
          if (!pant)
            throw new BadRequestException(
              `La pantalla ${pantalla.pantallaPublicId} no existe`,
            );
          permisos.push(
            this.permisosRepository.create({
              rolId: rol.id,
              pantallaId: pant.id,
              usuarioId,
              ver: pantalla.ver,
              crear: pantalla.crear,
              editar: pantalla.editar,
              eliminar: pantalla.eliminar,
              adjuntos: pantalla.adjuntos,
              reportes: pantalla.reportes,
            }),
          );
        }
      }

      for (const rolId of roles) {
        await this.permisosRepository.delete({ rolId });
      }
      return await this.permisosRepository.save(permisos);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscar() {
    try {
      return await this.permisosRepository.find({
        relations: { pantalla: true, rol: true },
        order: { rolId: 'ASC', pantallaId: 'ASC' },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarPorRolId(rolId: string) {
    try {
      const rol = await this.rolesRepository.findOne({
        where: { publicId: rolId, activo: true },
      });
      if (!rol) throw new BadRequestException(`El rol ${rolId} no existe`);
      return await this.permisosRepository.find({
        where: { rolId: rol.id },
        relations: { pantalla: true },
        order: { pantallaId: 'ASC' },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async reemplazarPermisosRol(dto: ActualizarPermisosRolDto) {
    const rol = await this.rolesRepository.findOne({
      where: { publicId: dto.rolId, activo: true },
    });
    if (!rol) throw new BadRequestException(`El rol ${dto.rolId} no existe`);

    const pantallas = await Promise.all(
      dto.pantallas.map((item) =>
        this.pantallasRepository.findOne({
          where: { publicId: item.pantallaId, activo: true },
        }),
      ),
    );
    if (pantallas.some((pantalla) => !pantalla)) {
      throw new BadRequestException(
        'Una o más pantallas no existen o están inactivas',
      );
    }

    await this.permisosRepository.delete({ rolId: rol.id });
    const permisos = dto.pantallas.map((pantalla, index) =>
      this.permisosRepository.create({
        rolId: rol.id,
        pantallaId: pantallas[index]!.id,
        ver: pantalla.ver,
        crear: pantalla.crear,
        editar: pantalla.editar,
        eliminar: pantalla.eliminar,
        adjuntos: pantalla.adjuntos,
        reportes: pantalla.reportes,
      }),
    );
    return this.permisosRepository.save(permisos);
  }
}
