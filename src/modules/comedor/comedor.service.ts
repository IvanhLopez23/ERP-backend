import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Roles } from '../roles/entities/role.entity';
import { Empleado } from '../rh/entities/empleado.entity';
import { Turno } from '../rh/entities/turno.entity';
import { CreateTurnoDto } from './dto/create-turno.dto';
import {
  CreateMenuComedorDto,
  CreateMenuComedorItemDto,
} from './dto/create-menu-comedor.dto';
import { CreateSolicitudComedorDto } from './dto/create-solicitud-comedor.dto';
import { MenuComedor } from './entities/menu-comedor.entity';
import { MenuComedorItem } from './entities/menu-comedor-item.entity';
import { SolicitudComedor } from './entities/solicitud-comedor.entity';
import { SolicitudComedorDetalle } from './entities/solicitud-comedor-detalle.entity';

const PERIODICIDADES = ['semanal', 'quincenal', 'mensual'] as const;

@Injectable()
export class ComedorService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
    @InjectRepository(Empleado)
    private readonly empleadosRepository: Repository<Empleado>,
    @InjectRepository(Turno)
    private readonly turnosRepository: Repository<Turno>,
    @InjectRepository(MenuComedor)
    private readonly menusRepository: Repository<MenuComedor>,
    @InjectRepository(MenuComedorItem)
    private readonly itemsRepository: Repository<MenuComedorItem>,
    @InjectRepository(SolicitudComedor)
    private readonly solicitudesRepository: Repository<SolicitudComedor>,
    @InjectRepository(SolicitudComedorDetalle)
    private readonly detallesRepository: Repository<SolicitudComedorDetalle>,
  ) {}

  async crearTurno(dto: CreateTurnoDto, internalRoleId: number) {
    await this.assertAdmin(internalRoleId);
    return this.turnosRepository.save(this.turnosRepository.create(dto));
  }

  listarTurnos() {
    return this.turnosRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async crearMenu(dto: CreateMenuComedorDto, internalRoleId: number) {
    await this.assertAdmin(internalRoleId);
    this.validatePeriodicity(dto.periodicidad);
    const fechaInicio = this.dateOnly(dto.fechaInicio);
    const fechaFin = this.dateOnly(dto.fechaFin);
    if (fechaFin < fechaInicio)
      throw new BadRequestException(
        'fechaFin debe ser posterior a fechaInicio',
      );
    this.validateItemsInsideMenu(dto.items, fechaInicio, fechaFin);

    const existing = await this.menusRepository.findOne({
      where: { periodicidad: dto.periodicidad, fechaInicio, fechaFin },
    });
    if (existing)
      throw new BadRequestException('Ya existe un menú para ese periodo');

    return this.dataSource.transaction(async (manager) => {
      const menu = await manager.getRepository(MenuComedor).save(
        manager.getRepository(MenuComedor).create({
          nombre: dto.nombre,
          periodicidad: dto.periodicidad,
          fechaInicio,
          fechaFin,
          activo: dto.activo ?? true,
        }),
      );
      const items = dto.items.map((item) =>
        manager.getRepository(MenuComedorItem).create({
          menuId: menu.id,
          fecha: this.dateOnly(item.fecha),
          tipoComida: item.tipoComida,
          descripcion: item.descripcion,
          activo: true,
        }),
      );
      await manager.getRepository(MenuComedorItem).save(items);
      return manager.getRepository(MenuComedor).findOne({
        where: { id: menu.id },
        relations: { items: true },
      });
    });
  }

  listarMenus() {
    return this.menusRepository.find({
      where: { activo: true },
      relations: { items: true },
      order: { fechaInicio: 'ASC' },
    });
  }

  async listarSiguienteMenu(internalUserId: number) {
    const empleado = await this.findEmpleado(internalUserId);
    if (!empleado.turno)
      throw new BadRequestException('El empleado no tiene turno asignado');
    const siguiente = this.nextPeriod(new Date(), empleado.turno.periodicidad);
    return this.menusRepository.find({
      where: {
        activo: true,
        periodicidad: empleado.turno.periodicidad,
        fechaInicio: siguiente.start,
        fechaFin: siguiente.end,
      },
      relations: { items: true },
    });
  }

  async crearSolicitud(dto: CreateSolicitudComedorDto, internalUserId: number) {
    const empleado = await this.findEmpleado(internalUserId);
    if (!empleado.turno)
      throw new BadRequestException('El empleado no tiene turno asignado');

    const menu = await this.menusRepository.findOne({
      where: { publicId: dto.menuPublicId, activo: true },
      relations: { items: true },
    });
    if (!menu) throw new NotFoundException('Menú no encontrado');
    if (menu.periodicidad !== empleado.turno.periodicidad) {
      throw new BadRequestException(
        'El menú no corresponde a la periodicidad del turno',
      );
    }
    const next = this.nextPeriod(new Date(), empleado.turno.periodicidad);
    if (this.dateKey(menu.fechaInicio) !== this.dateKey(next.start)) {
      throw new BadRequestException(
        `Solo se puede solicitar el menú del periodo ${this.dateKey(next.start)} al ${this.dateKey(next.end)}`,
      );
    }

    const requestedItems = await this.itemsRepository.find({
      where: {
        publicId: In(dto.menuItemPublicIds),
        menuId: menu.id,
        activo: true,
      },
    });
    if (requestedItems.length !== new Set(dto.menuItemPublicIds).size) {
      throw new BadRequestException('Una o más comidas no pertenecen al menú');
    }

    const existing = await this.solicitudesRepository.findOne({
      where: { empleadoId: empleado.id, menuId: menu.id },
    });
    if (existing)
      throw new BadRequestException('El empleado ya solicitó este menú');

    return this.dataSource.transaction(async (manager) => {
      const solicitud = await manager.getRepository(SolicitudComedor).save(
        manager.getRepository(SolicitudComedor).create({
          empleadoId: empleado.id,
          menuId: menu.id,
          estatus: 'solicitada',
          observaciones: dto.observaciones,
        }),
      );
      await manager.getRepository(SolicitudComedorDetalle).save(
        requestedItems.map((item) =>
          manager.getRepository(SolicitudComedorDetalle).create({
            solicitudId: solicitud.id,
            menuItemId: item.id,
          }),
        ),
      );
      return manager.getRepository(SolicitudComedor).findOne({
        where: { id: solicitud.id },
        relations: { menu: { items: true }, detalles: { menuItem: true } },
      });
    });
  }

  async listarMisSolicitudes(internalUserId: number) {
    const empleado = await this.findEmpleado(internalUserId);
    return this.solicitudesRepository.find({
      where: { empleadoId: empleado.id },
      relations: { menu: true, detalles: { menuItem: true } },
      order: { fechaSolicitud: 'DESC' },
    });
  }

  async cancelarSolicitud(publicId: string, internalUserId: number) {
    const empleado = await this.findEmpleado(internalUserId);
    const solicitud = await this.solicitudesRepository.findOne({
      where: { publicId, empleadoId: empleado.id },
    });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    if (solicitud.estatus === 'cancelada') return solicitud;
    solicitud.estatus = 'cancelada';
    return this.solicitudesRepository.save(solicitud);
  }

  private async findEmpleado(internalUserId: number) {
    const empleado = await this.empleadosRepository.findOne({
      where: { usuarioId: internalUserId, activo: true },
      relations: { turno: true },
    });
    if (!empleado)
      throw new NotFoundException(
        'No existe un empleado activo asociado al usuario',
      );
    return empleado;
  }

  private async assertAdmin(internalRoleId: number) {
    const role = await this.rolesRepository.findOne({
      where: { id: internalRoleId },
    });
    if (!role?.esAdministrador)
      throw new ForbiddenException('Se requiere un usuario administrador');
  }

  private validatePeriodicity(
    value: string,
  ): asserts value is (typeof PERIODICIDADES)[number] {
    if (!PERIODICIDADES.includes(value as (typeof PERIODICIDADES)[number])) {
      throw new BadRequestException('Periodicidad inválida');
    }
  }

  private validateItemsInsideMenu(
    items: CreateMenuComedorItemDto[],
    start: Date,
    end: Date,
  ) {
    const seen = new Set<string>();
    for (const item of items) {
      const date = this.dateOnly(item.fecha);
      if (date < start || date > end)
        throw new BadRequestException(
          'Las comidas deben estar dentro del periodo',
        );
      const key = `${this.dateKey(date)}:${item.tipoComida}`;
      if (seen.has(key))
        throw new BadRequestException(
          'No puede haber comidas duplicadas para la misma fecha',
        );
      seen.add(key);
    }
  }

  private nextPeriod(today: Date, periodicidad: string) {
    const current = this.dateOnly(today);
    if (periodicidad === 'semanal') {
      const day = current.getDay() || 7;
      const start = new Date(current);
      start.setDate(current.getDate() + (8 - day));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    }
    if (periodicidad === 'quincenal') {
      if (current.getDate() < 16) {
        const start = new Date(current.getFullYear(), current.getMonth(), 16);
        return {
          start,
          end: new Date(current.getFullYear(), current.getMonth() + 1, 0),
        };
      }
      const start = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      return {
        start,
        end: new Date(start.getFullYear(), start.getMonth(), 15),
      };
    }
    const start = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    return {
      start,
      end: new Date(start.getFullYear(), start.getMonth() + 1, 0),
    };
  }

  private dateOnly(value: string | Date) {
    const date =
      value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private dateKey(value: Date | string) {
    if (typeof value === 'string') return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
  }
}
