import { hashPassword } from 'src/common/helpers/crypto.helper';

import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePassUsuarioDto } from './dto/update-pass-usuario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuarios, Perfil } from './entities';
import { Repository, ILike, TreeLevelColumn } from 'typeorm';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
import { RolesService } from '../roles/roles.service';
import { Permiso } from '../permisos/entities/permiso.entity';
import { Pantalla } from '../pantallas/entities/pantalla.entity';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuarios)
    private readonly usuariosRepository: Repository<Usuarios>,

    @InjectRepository(Perfil)
    private readonly perfilRepository: Repository<Perfil>,
    private readonly rolesService: RolesService,
    @InjectRepository(Permiso)
    private readonly permisosRepository: Repository<Permiso>,
    @InjectRepository(Pantalla)
    private readonly pantallasRepository: Repository<Pantalla>,
    private readonly uploadsService: UploadsService,
  ) {}

  async crear(createUsuarioDto: CreateUsuarioDto) {
    try {
      const {
        perfil,
        rolPublicId,
        rolId: legacyRoleId,
        ...data
      } = createUsuarioDto as CreateUsuarioDto & { rolId?: number };
      const existeUsuario = await this.usuariosRepository.findOne({
        where: [{ nombreUsuario: data.nombreUsuario }, { correo: data.correo }],
      });

      if (existeUsuario) {
        throw new BadRequestException('El usuario o el correo ya existe');
      }

      const rol = rolPublicId
        ? await this.rolesService.buscarPorPublicId(rolPublicId)
        : await this.rolesService.buscarPorIdInterno(legacyRoleId as number);
      if (!rol || !rol.activo)
        throw new BadRequestException(
          'El rol asignado no existe o está inactivo',
        );

      data.contrasena = await hashPassword(data.contrasena);

      const usuario = this.usuariosRepository.create({
        ...data,
        rolId: rol.id,
        perfil: {
          ...perfil,
        },
      });

      return await this.usuariosRepository.save(usuario);
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
          { nombreUsuario: ILike(`%${buscar}%`) },
          { correo: ILike(`%${buscar}%`) },
        ];
      }

      const data = await this.usuariosRepository.find({
        take: registros,
        skip: (pagina - 1) * registros,
        where,
        order: {
          id: 'DESC',
        },
        relations: {
          rol: true,
          perfil: true,
        },
      });

      const total = await this.usuariosRepository.count({ where });
      return { total, data };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscar() {
    try {
      const usuarios = await this.usuariosRepository.find({
        relations: {
          rol: true,
          perfil: true,
        },
      });
      return usuarios;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarPorId(publicId: string) {
    try {
      const usuario = await this.usuariosRepository.findOne({
        where: { publicId },
        relations: {
          rol: true,
          perfil: true,
        },
      });

      if (!usuario) {
        throw new BadRequestException(`El usuario ${publicId} no existe`);
      }
      return usuario;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarPorNombreUsuario(nombreUsuario: string) {
    try {
      return await this.usuariosRepository.findOne({
        where: { nombreUsuario },
        select: {
          id: true,
          publicId: true,
          rolId: true,
          correo: true,
          nombreUsuario: true,
          contrasena: true,
          activo: true,
        },
        relations: { rol: true },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarPorCorreo(correo: string) {
    try {
      return await this.usuariosRepository.findOne({
        where: { correo },
        select: {
          id: true,
          publicId: true,
          correo: true,
          nombreUsuario: true,
          contrasena: true,
          activo: true,
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async actualizar(publicId: string, updateUsuarioDto: UpdateUsuarioDto) {
    try {
      const existeUsuario = await this.usuariosRepository.findOne({
        where: { publicId },
      });

      if (!existeUsuario) {
        throw new BadRequestException(`El usuario ${publicId} no existe`);
      }

      // Buscar si OTRO usuario ya tiene ese nombre
      if (updateUsuarioDto.nombreUsuario) {
        const usuarioDuplicado = await this.usuariosRepository.findOne({
          where: {
            nombreUsuario: updateUsuarioDto.nombreUsuario,
          },
        });

        if (usuarioDuplicado && usuarioDuplicado.id !== existeUsuario.id) {
          throw new BadRequestException(
            `El usuario ${updateUsuarioDto.nombreUsuario} ya existe`,
          );
        }
      }

      const updateData: any = { ...updateUsuarioDto };
      if (updateUsuarioDto.rolPublicId !== undefined) {
        const rol = await this.rolesService.buscarPorPublicId(
          updateUsuarioDto.rolPublicId,
        );
        if (!rol.activo)
          throw new BadRequestException('El rol asignado está inactivo');
        updateData.rolId = rol.id;
        delete updateData.rolPublicId;
      }

      await this.usuariosRepository.update(existeUsuario.id, updateData);

      return {
        message: 'Usuario actualizado correctamente',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async actualizarContrasena(
    publicId: string,
    UpdatePassUsuarioDto: UpdatePassUsuarioDto,
  ) {
    try {
      const existeUsuario = await this.usuariosRepository.findOne({
        where: { publicId },
      });

      if (!existeUsuario) {
        throw new BadRequestException(`El usuario ${publicId} no existe`);
      }

      const hashedPassword = await hashPassword(
        UpdatePassUsuarioDto.contrasena,
      );
      await this.usuariosRepository.update(existeUsuario.id, {
        contrasena: hashedPassword,
      });

      return {
        message: 'Contraseña actualizada correctamente',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async eliminar(publicId: string) {
    try {
      const existeUsuario = await this.usuariosRepository.findOne({
        where: { publicId },
      });
      if (!existeUsuario) {
        throw new BadRequestException(`El usuario ${publicId} no existe`);
      }
      const data = await this.usuariosRepository.remove(existeUsuario);
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async actualizarActivo(publicId: string) {
    try {
      const usuario = await this.usuariosRepository.findOne({
        where: { publicId },
      });
      if (!usuario) {
        throw new BadRequestException(`El usuario ${publicId} no existe`);
      }
      await this.usuariosRepository.update(usuario.id, {
        activo: !usuario.activo,
      });
      return {
        msg: `Usuario ${!usuario.activo ? 'activado' : 'desactivado'} correctamente`,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async actualizarPerfil(publicId: string, perfil: CreatePerfilDto) {
    try {
      const existeUsuario = await this.usuariosRepository.findOne({
        where: { publicId },
      });

      if (!existeUsuario) {
        throw new BadRequestException(`El usuario ${publicId} no existe`);
      }

      const perfilExistente = await this.perfilRepository.findOne({
        where: { usuarioId: existeUsuario.id },
      });

      if (perfilExistente) {
        await this.perfilRepository.update(
          { id: perfilExistente.id },
          { ...perfil, usuarioId: existeUsuario.id },
        );
        this.eliminarFotoAnterior(perfilExistente.foto, perfil.foto);
        return {
          message: 'Perfil actualizado correctamente',
        };
      }

      // Si no existe, creamos
      await this.perfilRepository.save({
        ...perfil,
        usuarioId: existeUsuario.id,
      });

      return {
        message: 'Perfil creado correctamente',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
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

  async buscarPorIdInterno(id: number) {
    return this.usuariosRepository.findOne({
      where: { id },
      relations: { rol: true, perfil: true },
    });
  }

  async buscarPermisos(usuarioId: number) {
    const usuario = await this.usuariosRepository.findOne({
      where: { id: usuarioId },
      relations: { rol: true },
    });
    if (!usuario)
      throw new BadRequestException(`El usuario ${usuarioId} no existe`);

    const perfil = await this.perfilRepository.findOne({
      where: { usuarioId: usuario.id },
    });

    const permisos = await this.permisosRepository.find({
      where: { rolId: usuario.rolId },
      relations: { pantalla: true },
      order: { pantallaId: 'ASC' },
    });

    const pantallas = await this.pantallasRepository.find({
      where: { activo: true },
      order: { orden: 'ASC', id: 'ASC' },
    });

    const permisoPorPantalla = new Map(
      permisos
        .filter((permiso) => permiso.pantalla?.activo)
        .map((permiso) => [permiso.pantallaId, permiso]),
    );

    const nodos = new Map<number, any>();

    // 1. Crear la estructura del nodo según si es padre o hijo
    for (const pantalla of pantallas) {
      const permiso = permisoPorPantalla.get(pantalla.id);

      const esPadre = pantalla.padreId === null;

      const nodo: any = {
        pantallaId: pantalla.publicId,
        nombre: pantalla.nombre,
        icono: pantalla.icono,
        ruta: pantalla.ruta,
        modulo: pantalla.modulo,
        ver: permiso?.ver ?? false,
        crear: permiso?.crear ?? false,
        editar: permiso?.editar ?? false,
        eliminar: permiso?.eliminar ?? false,
        adjuntos: permiso?.adjuntos ?? false,
        reportes: permiso?.reportes ?? false,
      };

      // Solo los nodos padre llevan la propiedad `children`
      if (esPadre) {
        nodo.childrens = [];
      }

      nodos.set(pantalla.id, nodo);
    }

    // 2. Construir la jerarquía
    const permisosJerarquicos: any[] = [];
    for (const pantalla of pantallas) {
      const nodo = nodos.get(pantalla.id);
      const padre = pantalla.padreId ? nodos.get(pantalla.padreId) : undefined;

      if (padre) {
        // Si el padre existe, aseguramos que su arreglo children tenga el nodo
        if (padre.childrens) {
          padre.childrens.push(nodo);
        }
      } else {
        permisosJerarquicos.push(nodo);
      }
    }

    return {
      id: usuario.publicId,
      rolId: usuario.rol?.publicId,
      perfil: {
        nombre: perfil?.nombre,
        apellidoPaterno: perfil?.apellidoPaterno,
        apellidoMaterno: perfil?.apellidoMaterno,
        genero: perfil?.genero,
        fechaNacimiento: perfil?.fechaNacimiento,
        foto: perfil?.foto,
      },
      esAdministrador: usuario.rol.esAdministrador,
      permisos: permisosJerarquicos,
    };
  }
}
