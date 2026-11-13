import { Injectable } from '@nestjs/common';

import { roles, usuarios, pantallas, permisos } from './data/inicio';
import { RolesService } from '../roles/roles.service';
import { PantallasService } from '../pantallas/pantallas.service';
import { PermisosService } from '../permisos/permisos.service';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly rolesService: RolesService,
    private readonly pantallasService: PantallasService,
    private readonly permisosService: PermisosService,
    private readonly usuariosService: UsuariosService,
  ) {}

  async executeSeed() {
    await this.insertSeed();
    return `Semilla Creada`;
  }

  private async insertSeed() {
    const rolesData = roles;
    const pantallasData = pantallas;

    // Crear roles (quedan con auto-incremento 1..N)
    const rolesCreados: { id: number; publicId: string }[] = [];
    for (const rol of rolesData) {
      const creado = await this.rolesService.crear(rol);
      rolesCreados.push({ id: creado.id, publicId: creado.publicId });
    }

    // Crear usuarios (rolId numérico lo resuelve el servicio vía legacyRoleId)
    const usuariosCreados: { id: number; publicId: string }[] = [];
    for (const usuario of usuarios) {
      const creado = await this.usuariosService.crear(usuario as any);
      usuariosCreados.push({ id: creado.id, publicId: creado.publicId });
    }

    // Crear pantallas resolviendo padreId numérico -> publicId
    const pantallasCreados: { id: number; publicId: string }[] = [];
    for (const pantalla of pantallasData) {
      const { padreId, ...datos } = pantalla;
      const creado = await this.pantallasService.crear({
        ...datos,
        padreId: padreId ? pantallasCreados[padreId - 1]?.publicId : undefined,
      });
      pantallasCreados.push({ id: creado.id, publicId: creado.publicId });
    }

    // Crear permisos resolviendo ids numéricos -> publicId
    // (usuarioId se registra como el primer usuario creado)
    const usuarioSeedId = usuariosCreados[0]?.id;
    const permisosResueltos = permisos.map((p) => ({
      rolPublicId: rolesCreados.find((r) => r.id === p.rolId)?.publicId,
      pantallas: p.pantallas.map((s) => ({
        ...s,
        pantallaPublicId: pantallasCreados[s.pantallaId - 1]?.publicId,
      })),
    }));
    await this.permisosService.crearPermisosFull(
      permisosResueltos as any,
      usuarioSeedId,
    );
  }
}
