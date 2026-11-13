import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { DataSource, EntityTarget } from 'typeorm';
import { Roles } from '../../modules/roles/entities/role.entity';
import { Usuarios } from '../../modules/usuarios/entities/usuario.entity';
import { Pantalla } from '../../modules/pantallas/entities/pantalla.entity';
import { Producto } from '../../modules/almacen/entities/producto.entity';
import { CategoriaProducto } from '../../modules/almacen/entities/categoria-producto.entity';
import { UnidadMedida } from '../../modules/almacen/entities/unidad-medida.entity';
import { Almacen } from '../../modules/almacen/entities/almacen.entity';
import { Proveedor } from '../../modules/compras/entities/proveedor.entity';
import { Cliente } from '../../modules/ventas/entities/cliente.entity';
import { Cotizacion } from '../../modules/ventas/entities/cotizacion.entity';
import { Empleado } from '../../modules/rh/entities/empleado.entity';
import { Turno } from '../../modules/rh/entities/turno.entity';
import { Equipo } from '../../modules/mantenimiento/entities/equipo.entity';
import { PlanMantenimiento } from '../../modules/mantenimiento/entities/plan-mantenimiento.entity';
import { OrdenTrabajo } from '../../modules/mantenimiento/entities/orden-trabajo.entity';
import { Refaccion } from '../../modules/mantenimiento/entities/refaccion.entity';
import { Departamento } from '../../modules/rh/entities/departamento.entity';
import { Puesto } from '../../modules/rh/entities/puesto.entity';
import { PeriodoVacacional } from '../../modules/rh/entities/periodo-vacacional.entity';
import { Conversacion } from '../../modules/chat/entities/conversacion.entity';
import { Mensaje } from '../../modules/chat/entities/mensaje.entity';
import { PUBLIC_ID_PATTERN } from '../validation/public-id';

type Mapping = [
  publicKey: string,
  internalKey: string,
  entity: EntityTarget<{ id: number; publicId: string }>,
];

const mappings: Mapping[] = [
  ['rolId', 'rolId', Roles],
  ['usuarioId', 'usuarioId', Usuarios],
  ['participanteIds', 'participanteIds', Usuarios],
  ['pantallaId', 'pantallaId', Pantalla],
  ['productoId', 'productoId', Producto],
  ['categoriaId', 'categoriaId', CategoriaProducto],
  ['unidadMedidaId', 'unidadMedidaId', UnidadMedida],
  ['almacenId', 'almacenId', Almacen],
  ['proveedorId', 'proveedorId', Proveedor],
  ['clienteId', 'clienteId', Cliente],
  ['cotizacionId', 'cotizacionId', Cotizacion],
  ['vendedorId', 'vendedorId', Empleado],
  ['empleadoId', 'empleadoId', Empleado],
  ['turnoId', 'turnoId', Turno],
  ['equipoId', 'equipoId', Equipo],
  ['planMantenimientoId', 'planMantenimientoId', PlanMantenimiento],
  ['ordenTrabajoId', 'ordenTrabajoId', OrdenTrabajo],
  ['refaccionId', 'refaccionId', Refaccion],
  ['departamentoId', 'departamentoId', Departamento],
  ['puestoId', 'puestoId', Puesto],
  ['periodoVacacionalId', 'periodoVacacionalId', PeriodoVacacional],
  ['conversacionId', 'conversacionId', Conversacion],
  ['mensajeId', 'mensajeId', Mensaje],
];

@Injectable()
export class PublicIdInputMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  async use(request: Request, _response: Response, next: NextFunction) {
    await this.resolveContainer(
      request.body as Record<string, unknown> | undefined,
    );
    await this.resolveContainer(request.query);
    next();
  }

  private async resolveContainer(container?: Record<string, unknown>) {
    if (!container) return;

    for (const [publicKey, internalKey, entity] of mappings) {
      if (publicKey === internalKey) continue;

      const publicValue = container[publicKey];
      const internalValue = container[internalKey];
      const value =
        publicValue !== undefined
          ? publicValue
          : typeof internalValue === 'string' &&
              PUBLIC_ID_PATTERN.test(internalValue)
            ? internalValue
            : undefined;
      if (value === undefined) continue;
      const values = Array.isArray(value) ? value : [value];
      const ids: number[] = [];

      for (const candidate of values) {
        if (
          typeof candidate !== 'string' ||
          !PUBLIC_ID_PATTERN.test(candidate)
        ) {
          throw new BadRequestException(
            `${publicKey} debe ser un UUID v7 válido`,
          );
        }
        const record = await this.dataSource
          .getRepository(entity)
          .findOne({ where: { publicId: candidate } });
        if (!record)
          throw new BadRequestException(
            `No existe un recurso para ${publicKey}`,
          );
        ids.push(record.id);
      }

      container[internalKey] = Array.isArray(value) ? ids : ids[0];
      delete container[publicKey];
    }
  }
}
