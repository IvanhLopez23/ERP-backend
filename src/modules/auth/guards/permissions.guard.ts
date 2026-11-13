import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { Usuarios } from '../../usuarios/entities/usuario.entity';
import { Pantalla } from '../../pantallas/entities/pantalla.entity';
import { Permiso } from '../../permisos/entities/permiso.entity';
import {
  ADMINISTRATOR_ONLY_KEY,
  PERMISSION_ROUTE_KEY,
  SKIP_PERMISSION_KEY,
} from '../decorators/require-permission.decorator';

type PermissionAction = 'ver' | 'crear' | 'editar' | 'eliminar';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Usuarios)
    private readonly usuariosRepository: Repository<Usuarios>,
    @InjectRepository(Pantalla)
    private readonly pantallasRepository: Repository<Pantalla>,
    @InjectRepository(Permiso)
    private readonly permisosRepository: Repository<Permiso>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const skipPermission = this.reflector.getAllAndOverride<boolean>(
      SKIP_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requireAdministrator = this.reflector.getAllAndOverride<boolean>(
      ADMINISTRATOR_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );
    const ruta = this.reflector.getAllAndOverride<string>(
      PERMISSION_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!ruta && !requireAdministrator && !skipPermission) return true;

    const userId = (request as Request & { user?: { internalId?: number } })
      .user?.internalId;
    if (!userId) throw new UnauthorizedException('Usuario no autenticado');

    const usuario = await this.usuariosRepository.findOne({
      where: { id: userId },
      relations: { rol: true },
    });
    if (!usuario || !usuario.activo || !usuario.rol?.activo) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    if (skipPermission) return true;

    if (usuario.rol.esAdministrador) return true;
    if (requireAdministrator) {
      throw new ForbiddenException('Se requiere un usuario administrador');
    }

    const pantalla = await this.pantallasRepository.findOne({
      where: { ruta, activo: true },
    });
    if (!pantalla) {
      throw new ForbiddenException(`La pantalla ${ruta} no está configurada`);
    }

    const permiso = await this.permisosRepository.findOne({
      where: { rolId: usuario.rolId, pantallaId: pantalla.id },
    });
    const accion = this.obtenerAccion(request.method);
    if (!permiso || !permiso[accion]) {
      throw new ForbiddenException(
        'No tienes permiso para realizar esta acción',
      );
    }

    return true;
  }

  private obtenerAccion(method: string): PermissionAction {
    switch (method) {
      case 'POST':
        return 'crear';
      case 'PUT':
      case 'PATCH':
        return 'editar';
      case 'DELETE':
        return 'eliminar';
      default:
        return 'ver';
    }
  }
}
