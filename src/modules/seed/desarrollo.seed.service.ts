import { Injectable } from '@nestjs/common';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindOptionsWhere,
  IsNull,
} from 'typeorm';
import { roles, pantallas, usuarios } from './data/inicio';
import { hashPassword } from '../../common/helpers/crypto.helper';

import { Roles } from '../roles/entities/role.entity';
import { Pantalla } from '../pantallas/entities/pantalla.entity';
import { Permiso } from '../permisos/entities/permiso.entity';
import { Usuarios } from '../usuarios/entities/usuario.entity';
import { Perfil } from '../usuarios/entities/perfil.entity';

import { CategoriaProducto } from '../almacen/entities/categoria-producto.entity';
import { UnidadMedida } from '../almacen/entities/unidad-medida.entity';
import { Almacen } from '../almacen/entities/almacen.entity';
import { Producto } from '../almacen/entities/producto.entity';
import { Inventario } from '../almacen/entities/inventario.entity';
import { MovimientoInventario } from '../almacen/entities/movimiento-inventario.entity';

import { Proveedor } from '../compras/entities/proveedor.entity';
import { Compra } from '../compras/entities/compra.entity';
import { DetalleCompra } from '../compras/entities/detalle-compra.entity';

import { Cliente } from '../ventas/entities/cliente.entity';
import { Cotizacion } from '../ventas/entities/cotizacion.entity';
import { DetalleCotizacion } from '../ventas/entities/detalle-cotizacion.entity';
import { Venta } from '../ventas/entities/venta.entity';
import { DetalleVenta } from '../ventas/entities/detalle-venta.entity';

import { Departamento } from '../rh/entities/departamento.entity';
import { Puesto } from '../rh/entities/puesto.entity';
import { Empleado } from '../rh/entities/empleado.entity';
import { Turno } from '../rh/entities/turno.entity';
import { Contrato } from '../rh/entities/contrato.entity';
import { Asistencia } from '../rh/entities/asistencia.entity';
import { PoliticaVacacional } from '../rh/entities/politica-vacacional.entity';

import { Equipo } from '../mantenimiento/entities/equipo.entity';
import { PlanMantenimiento } from '../mantenimiento/entities/plan-mantenimiento.entity';
import { OrdenTrabajo } from '../mantenimiento/entities/orden-trabajo.entity';
import { DetalleOrdenTrabajo } from '../mantenimiento/entities/detalle-orden-trabajo.entity';
import { Refaccion } from '../mantenimiento/entities/refaccion.entity';
import { MovimientoRefaccion } from '../mantenimiento/entities/movimiento-refaccion.entity';

import { Conversacion } from '../chat/entities/conversacion.entity';
import { ConversacionParticipante } from '../chat/entities/conversacion-participante.entity';
import { Mensaje } from '../chat/entities/mensaje.entity';
import { MenuComedor } from '../comedor/entities/menu-comedor.entity';
import { MenuComedorItem } from '../comedor/entities/menu-comedor-item.entity';
import { SolicitudComedor } from '../comedor/entities/solicitud-comedor.entity';
import { SolicitudComedorDetalle } from '../comedor/entities/solicitud-comedor-detalle.entity';

import { CuentaContable } from '../contabilidad/entities/cuenta-contable.entity';
import { PeriodoContable } from '../contabilidad/entities/periodo-contable.entity';
import { Poliza } from '../contabilidad/entities/poliza.entity';
import { PolizaDetalle } from '../contabilidad/entities/poliza-detalle.entity';

interface EntidadConId {
  id: number;
}

@Injectable()
export class DesarrolloSeedService {
  constructor(private readonly dataSource: DataSource) {}

  async executeDesarrolloSeed() {
    return this.dataSource.transaction(async (manager) => {
      const adminRole = await this.seedRoles(manager);
      const pantallasMapa = await this.seedPantallas(manager);
      await this.seedPantallasComedor(manager, pantallasMapa);
      const adminUsuario = await this.seedUsuarios(manager, adminRole);
      await this.seedPermisos(manager, pantallasMapa);

      const unidad = await this.seedUnidad(manager);
      const categoria = await this.seedCategoria(manager);
      const almacen = await this.seedAlmacen(manager);
      const producto = await this.seedProducto(manager, unidad, categoria);
      await this.seedInventario(manager, producto, almacen, adminUsuario);

      const proveedor = await this.seedProveedor(manager);
      const cliente = await this.seedCliente(manager);
      await this.seedCompra(manager, proveedor, producto, adminUsuario);
      await this.seedCotizacion(manager, cliente, producto, adminUsuario);
      await this.seedVenta(manager, cliente, producto, adminUsuario);
      await this.seedContabilidad(manager, adminUsuario);

      const departamento = await this.seedDepartamento(manager);
      const puesto = await this.seedPuesto(manager, departamento);
      const turno = await this.seedTurno(manager);
      const empleado = await this.seedEmpleado(
        manager,
        departamento,
        puesto,
        turno,
      );
      await this.seedComedor(manager, empleado, turno);
      await this.seedContrato(manager, empleado);
      await this.seedAsistencia(manager, empleado);
      await this.seedPoliticaVacacional(manager);

      const equipo = await this.seedEquipo(manager);
      const plan = await this.seedPlan(manager, equipo);
      const refaccion = await this.seedRefaccion(manager, producto);
      await this.seedOrden(manager, equipo, plan, adminUsuario);
      await this.seedMovimientoRefaccion(manager, refaccion, adminUsuario);

      const devUsuario = await this.seedUsuarioDev(manager, adminRole);
      await this.seedChat(manager, adminUsuario, devUsuario);

      return {
        message:
          'Ambiente de desarrollo inicializado correctamente con datos base y catálogos demo.',
      };
    });
  }

  private async upsert<T extends EntidadConId>(
    manager: EntityManager,
    entity: EntityTarget<T>,
    findWhere: FindOptionsWhere<T>,
    data: DeepPartial<T>,
  ): Promise<T> {
    const repository = manager.getRepository(entity);
    const existente = await repository.findOne({ where: findWhere });
    if (existente) return existente;
    return repository.save(repository.create(data));
  }

  private async seedRoles(manager: EntityManager): Promise<Roles | null> {
    const repository = manager.getRepository(Roles);
    let administrador: Roles | null = null;

    for (const rol of roles) {
      const existente = await repository.findOne({
        where: { descripcion: rol.descripcion },
      });
      const guardado =
        existente ?? (await repository.save(repository.create(rol)));
      if (rol.descripcion === 'AdministraGOG') administrador = guardado;
    }

    return (
      administrador ??
      (await repository.findOne({ where: { descripcion: 'AdministraGOG' } }))
    );
  }

  private async seedPantallas(manager: EntityManager) {
    const repository = manager.getRepository(Pantalla);
    const mapa = new Map<number, Pantalla>();

    for (let index = 0; index < pantallas.length; index++) {
      const pantalla = pantallas[index];
      let existente = await repository.findOne({
        where: { ruta: pantalla.ruta },
      });

      if (!existente) {
        const padre = pantalla.padreId ? mapa.get(pantalla.padreId) : undefined;
        existente = await repository.save(
          repository.create({
            nombre: pantalla.nombre,
            ruta: pantalla.ruta,
            icono: pantalla.icono,
            orden: pantalla.orden,
            padreId: padre?.id,
            subMenu: pantalla.subMenu,
            modulo: pantalla.modulo,
            activo: true,
          }),
        );
      }

      mapa.set(index + 1, existente);
    }

    return mapa;
  }

  private async seedPantallasComedor(
    manager: EntityManager,
    pantallasMapa: Map<number, Pantalla>,
  ) {
    const comedor = await this.upsert(
      manager,
      Pantalla,
      { ruta: '/comedor' },
      {
        nombre: 'Comedor',
        ruta: '/comedor',
        icono: 'mdi-food',
        orden: 8,
        activo: true,
      },
    );
    pantallasMapa.set(pantallasMapa.size + 1, comedor);

    const pantallasComedor = [
      {
        nombre: 'Menús de comedor',
        ruta: '/comedor/menus',
        icono: 'mdi-silverware-fork-knife',
        orden: 1,
      },
      {
        nombre: 'Solicitudes de comedor',
        ruta: '/comedor/solicitudes',
        icono: 'mdi-calendar-check',
        orden: 2,
      },
      {
        nombre: 'Turnos de comedor',
        ruta: '/comedor/turnos',
        icono: 'mdi-calendar-clock',
        orden: 3,
      },
    ];

    for (const pantalla of pantallasComedor) {
      const item = await this.upsert(
        manager,
        Pantalla,
        { ruta: pantalla.ruta },
        { ...pantalla, padreId: comedor.id, activo: true },
      );
      pantallasMapa.set(pantallasMapa.size + 1, item);
    }
  }

  private async seedUsuarios(
    manager: EntityManager,
    adminRole: Roles | null,
  ): Promise<Usuarios | null> {
    const usuarioRepo = manager.getRepository(Usuarios);
    const perfilRepo = manager.getRepository(Perfil);
    let admin: Usuarios | null = null;

    for (const usuario of usuarios) {
      let existente = await usuarioRepo.findOne({
        where: { nombreUsuario: usuario.nombreUsuario },
      });

      if (!existente) {
        const rol =
          adminRole ??
          (await manager
            .getRepository(Roles)
            .findOne({ where: { descripcion: roles[0].descripcion } }));
        if (!rol) continue;
        const contrasena = await hashPassword(usuario.contrasena);
        existente = await usuarioRepo.save(
          usuarioRepo.create({
            nombreUsuario: usuario.nombreUsuario,
            correo: usuario.correo,
            contrasena,
            activo: true,
            rolId: rol.id,
          }),
        );
        await perfilRepo.save(
          perfilRepo.create({
            ...usuario.perfil,
            usuarioId: existente.id,
          }),
        );
      }

      if (usuario.nombreUsuario === 'admin') admin = existente;
    }

    return admin;
  }

  private async seedUsuarioDev(
    manager: EntityManager,
    adminRole: Roles | null,
  ): Promise<Usuarios | null> {
    const usuarioRepo = manager.getRepository(Usuarios);
    const perfilRepo = manager.getRepository(Perfil);
    const rol =
      adminRole ??
      (await manager
        .getRepository(Roles)
        .findOne({ where: { descripcion: roles[1].descripcion } }));

    let dev = await usuarioRepo.findOne({ where: { nombreUsuario: 'dev' } });
    if (!dev && rol) {
      dev = await usuarioRepo.save(
        usuarioRepo.create({
          nombreUsuario: 'dev',
          correo: 'dev@ticsa.mx',
          contrasena: await hashPassword('1234'),
          activo: true,
          rolId: rol.id,
        }),
      );
      await perfilRepo.save(
        perfilRepo.create({
          nombre: 'Desarrollo',
          apellidoPaterno: 'Demo',
          apellidoMaterno: 'Demo',
          genero: 'M',
          usuarioId: dev.id,
        }),
      );
    }

    return dev;
  }

  private async seedPermisos(
    manager: EntityManager,
    pantallasMapa: Map<number, Pantalla>,
  ) {
    const rolRepo = manager.getRepository(Roles);
    const permisoRepo = manager.getRepository(Permiso);
    const todosRoles = await rolRepo.find();

    for (const rol of todosRoles) {
      for (const pantalla of pantallasMapa.values()) {
        const existente = await permisoRepo.findOne({
          where: { rolId: rol.id, pantallaId: pantalla.id },
        });
        if (!existente) {
          await permisoRepo.save(
            permisoRepo.create({
              rolId: rol.id,
              pantallaId: pantalla.id,
              ver: true,
              crear: true,
              editar: true,
              eliminar: true,
              adjuntos: true,
              reportes: true,
            }),
          );
        }
      }
    }
  }

  private async seedUnidad(manager: EntityManager) {
    return this.upsert(
      manager,
      UnidadMedida,
      { nombre: 'Pieza' },
      { nombre: 'Pieza', abreviatura: 'pz', activo: true },
    );
  }

  private async seedCategoria(manager: EntityManager) {
    return this.upsert(
      manager,
      CategoriaProducto,
      { nombre: 'Herramientas Dev' },
      {
        nombre: 'Herramientas Dev',
        descripcion: 'Categoría demo de desarrollo',
        activo: true,
      },
    );
  }

  private async seedAlmacen(manager: EntityManager) {
    return this.upsert(
      manager,
      Almacen,
      { nombre: 'Almacén Desarrollo' },
      {
        nombre: 'Almacén Desarrollo',
        ubicacion: 'Zona de desarrollo',
        activo: true,
      },
    );
  }

  private async seedProducto(
    manager: EntityManager,
    unidad: UnidadMedida,
    categoria: CategoriaProducto,
  ) {
    return this.upsert(
      manager,
      Producto,
      { codigo: 'DEV-PROD-001' },
      {
        codigo: 'DEV-PROD-001',
        nombre: 'Producto demo',
        descripcion: 'Producto de ejemplo para ambiente de desarrollo',
        precioCosto: 10,
        precioVenta: 15,
        unidadMedidaId: unidad.id,
        categoriaId: categoria.id,
        activo: true,
      },
    );
  }

  private async seedInventario(
    manager: EntityManager,
    producto: Producto,
    almacen: Almacen,
    usuario: Usuarios | null,
  ) {
    const inventarioRepo = manager.getRepository(Inventario);
    let inventario = await inventarioRepo.findOne({
      where: { productoId: producto.id, almacenId: almacen.id },
    });

    if (!inventario) {
      inventario = await inventarioRepo.save(
        inventarioRepo.create({
          productoId: producto.id,
          almacenId: almacen.id,
          existencia: 10,
        }),
      );
    }

    if (usuario) {
      const movimientoRepo = manager.getRepository(MovimientoInventario);
      const existenteMov = await movimientoRepo.findOne({
        where: {
          productoId: producto.id,
          almacenId: almacen.id,
          tipo: 'entrada',
          referencia: 'DEV-SEED',
        },
      });
      if (!existenteMov) {
        await movimientoRepo.save(
          movimientoRepo.create({
            productoId: producto.id,
            almacenId: almacen.id,
            tipo: 'entrada',
            cantidad: 10,
            existenciaAnterior: 0,
            existenciaNueva: 10,
            referencia: 'DEV-SEED',
            observaciones: 'Inventario inicial de desarrollo',
            usuarioId: usuario.id,
          }),
        );
      }
    }
  }

  private async seedProveedor(manager: EntityManager) {
    return this.upsert(
      manager,
      Proveedor,
      { codigo: 'PROV-DEV-001' },
      { codigo: 'PROV-DEV-001', nombre: 'Proveedor demo', activo: true },
    );
  }

  private async seedCliente(manager: EntityManager) {
    return this.upsert(
      manager,
      Cliente,
      { codigo: 'CLI-DEV-001' },
      {
        codigo: 'CLI-DEV-001',
        nombre: 'Cliente demo',
        tipo: 'cliente',
        activo: true,
      },
    );
  }

  private async seedCompra(
    manager: EntityManager,
    proveedor: Proveedor,
    producto: Producto,
    usuario: Usuarios | null,
  ) {
    const compraRepo = manager.getRepository(Compra);
    let compra = await compraRepo.findOne({ where: { folio: 'DEV-CMP-0001' } });

    if (!compra) {
      compra = await compraRepo.save(
        compraRepo.create({
          folio: 'DEV-CMP-0001',
          proveedorId: proveedor.id,
          fechaCompra: new Date('2026-01-15'),
          subtotal: 100,
          iva: 16,
          total: 116,
          estatus: 'pendiente',
          observaciones: 'Compra demo de desarrollo',
          usuarioId: usuario?.id,
        }),
      );
      await manager.getRepository(DetalleCompra).save(
        manager.getRepository(DetalleCompra).create({
          compraId: compra.id,
          productoId: producto.id,
          cantidad: 10,
          precioUnitario: 10,
          subtotal: 100,
        }),
      );
    }
  }

  private async seedCotizacion(
    manager: EntityManager,
    cliente: Cliente,
    producto: Producto,
    usuario: Usuarios | null,
  ) {
    const cotizacionRepo = manager.getRepository(Cotizacion);
    let cotizacion = await cotizacionRepo.findOne({
      where: { folio: 'DEV-COT-0001' },
    });

    if (!cotizacion) {
      cotizacion = await cotizacionRepo.save(
        cotizacionRepo.create({
          folio: 'DEV-COT-0001',
          clienteId: cliente.id,
          fecha: new Date('2026-01-20'),
          diasValidez: 30,
          subtotal: 30,
          descuento: 0,
          iva: 4.8,
          total: 34.8,
          estatus: 'pendiente',
          observaciones: 'Cotización demo de desarrollo',
          usuarioId: usuario?.id,
        }),
      );
      await manager.getRepository(DetalleCotizacion).save(
        manager.getRepository(DetalleCotizacion).create({
          cotizacionId: cotizacion.id,
          productoId: producto.id,
          cantidad: 2,
          precioUnitario: 15,
          descuento: 0,
          subtotal: 30,
        }),
      );
    }
  }

  private async seedVenta(
    manager: EntityManager,
    cliente: Cliente,
    producto: Producto,
    usuario: Usuarios | null,
  ) {
    const ventaRepo = manager.getRepository(Venta);
    let venta = await ventaRepo.findOne({ where: { folio: 'DEV-VTA-0001' } });

    if (!venta) {
      venta = await ventaRepo.save(
        ventaRepo.create({
          folio: 'DEV-VTA-0001',
          clienteId: cliente.id,
          fechaVenta: new Date('2026-02-01'),
          subtotal: 15,
          descuento: 0,
          iva: 2.4,
          total: 17.4,
          estatus: 'pendiente',
          observaciones: 'Venta demo de desarrollo',
          usuarioId: usuario?.id,
        }),
      );
      await manager.getRepository(DetalleVenta).save(
        manager.getRepository(DetalleVenta).create({
          ventaId: venta.id,
          productoId: producto.id,
          cantidad: 1,
          precioUnitario: 15,
          descuento: 0,
          subtotal: 15,
        }),
      );
    }
  }

  private async seedContabilidad(
    manager: EntityManager,
    usuario: Usuarios | null,
  ) {
    const cuentaRepo = manager.getRepository(CuentaContable);
    const cuentasSeed: Array<{
      codigo: string;
      nombre: string;
      tipo: string;
      naturaleza: string;
      padreCodigo?: string;
      descripcion?: string;
      permiteMovimientos?: boolean;
    }> = [
      {
        codigo: '1000',
        nombre: 'Activo',
        tipo: 'activo',
        naturaleza: 'deudora',
        permiteMovimientos: false,
      },
      {
        codigo: '1100',
        nombre: 'Activo circulante',
        tipo: 'activo',
        naturaleza: 'deudora',
        padreCodigo: '1000',
        permiteMovimientos: false,
      },
      {
        codigo: '1101',
        nombre: 'Caja',
        tipo: 'activo',
        naturaleza: 'deudora',
        padreCodigo: '1100',
      },
      {
        codigo: '1102',
        nombre: 'Bancos',
        tipo: 'activo',
        naturaleza: 'deudora',
        padreCodigo: '1100',
      },
      {
        codigo: '1103',
        nombre: 'Clientes',
        tipo: 'activo',
        naturaleza: 'deudora',
        padreCodigo: '1100',
      },
      {
        codigo: '1104',
        nombre: 'IVA acreditable',
        tipo: 'activo',
        naturaleza: 'deudora',
        padreCodigo: '1100',
      },
      {
        codigo: '1105',
        nombre: 'Inventario',
        tipo: 'activo',
        naturaleza: 'deudora',
        padreCodigo: '1100',
      },
      {
        codigo: '1106',
        nombre: 'Tarjetas por cobrar',
        tipo: 'activo',
        naturaleza: 'deudora',
        padreCodigo: '1100',
      },
      {
        codigo: '1200',
        nombre: 'Activo fijo',
        tipo: 'activo',
        naturaleza: 'deudora',
        padreCodigo: '1000',
        permiteMovimientos: false,
      },
      {
        codigo: '1201',
        nombre: 'Equipo de cómputo',
        tipo: 'activo',
        naturaleza: 'deudora',
        padreCodigo: '1200',
      },
      {
        codigo: '2000',
        nombre: 'Pasivo',
        tipo: 'pasivo',
        naturaleza: 'acreedora',
        permiteMovimientos: false,
      },
      {
        codigo: '2100',
        nombre: 'Pasivo circulante',
        tipo: 'pasivo',
        naturaleza: 'acreedora',
        padreCodigo: '2000',
        permiteMovimientos: false,
      },
      {
        codigo: '2101',
        nombre: 'Proveedores',
        tipo: 'pasivo',
        naturaleza: 'acreedora',
        padreCodigo: '2100',
      },
      {
        codigo: '2102',
        nombre: 'IVA trasladado',
        tipo: 'pasivo',
        naturaleza: 'acreedora',
        padreCodigo: '2100',
      },
      {
        codigo: '2103',
        nombre: 'Impuestos por pagar',
        tipo: 'pasivo',
        naturaleza: 'acreedora',
        padreCodigo: '2100',
      },
      {
        codigo: '2104',
        nombre: 'ISR retenido',
        tipo: 'pasivo',
        naturaleza: 'acreedora',
        padreCodigo: '2100',
      },
      {
        codigo: '2105',
        nombre: 'IMSS por pagar',
        tipo: 'pasivo',
        naturaleza: 'acreedora',
        padreCodigo: '2100',
      },
      {
        codigo: '2106',
        nombre: 'Provisiones por pagar',
        tipo: 'pasivo',
        naturaleza: 'acreedora',
        padreCodigo: '2100',
      },
      {
        codigo: '3000',
        nombre: 'Capital',
        tipo: 'capital',
        naturaleza: 'acreedora',
        permiteMovimientos: false,
      },
      {
        codigo: '3101',
        nombre: 'Capital social',
        tipo: 'capital',
        naturaleza: 'acreedora',
        padreCodigo: '3000',
      },
      {
        codigo: '3102',
        nombre: 'Resultados acumulados',
        tipo: 'capital',
        naturaleza: 'acreedora',
        padreCodigo: '3000',
      },
      {
        codigo: '4000',
        nombre: 'Ingresos',
        tipo: 'ingreso',
        naturaleza: 'acreedora',
        permiteMovimientos: false,
      },
      {
        codigo: '4101',
        nombre: 'Ventas',
        tipo: 'ingreso',
        naturaleza: 'acreedora',
        padreCodigo: '4000',
      },
      {
        codigo: '4102',
        nombre: 'Otros ingresos',
        tipo: 'ingreso',
        naturaleza: 'acreedora',
        padreCodigo: '4000',
      },
      {
        codigo: '5000',
        nombre: 'Gastos',
        tipo: 'gasto',
        naturaleza: 'deudora',
        permiteMovimientos: false,
      },
      {
        codigo: '5101',
        nombre: 'Costo de ventas',
        tipo: 'gasto',
        naturaleza: 'deudora',
        padreCodigo: '5000',
      },
      {
        codigo: '5102',
        nombre: 'Gastos de operación',
        tipo: 'gasto',
        naturaleza: 'deudora',
        padreCodigo: '5000',
      },
      {
        codigo: '5103',
        nombre: 'Gastos financieros',
        tipo: 'gasto',
        naturaleza: 'deudora',
        padreCodigo: '5000',
      },
      {
        codigo: '5104',
        nombre: 'Sueldos y salarios',
        tipo: 'gasto',
        naturaleza: 'deudora',
        padreCodigo: '5000',
      },
      {
        codigo: '5105',
        nombre: 'IMSS y aportaciones',
        tipo: 'gasto',
        naturaleza: 'deudora',
        padreCodigo: '5000',
      },
      {
        codigo: '5106',
        nombre: 'Provisiones de prestaciones',
        tipo: 'gasto',
        naturaleza: 'deudora',
        padreCodigo: '5000',
      },
    ];

    const mapa = new Map<string, CuentaContable>();
    for (const item of cuentasSeed) {
      const padre = item.padreCodigo ? mapa.get(item.padreCodigo) : undefined;
      let cuenta = await cuentaRepo.findOne({
        where: { codigo: item.codigo },
      });
      if (!cuenta) {
        cuenta = await cuentaRepo.save(
          cuentaRepo.create({
            codigo: item.codigo,
            nombre: item.nombre,
            descripcion: item.descripcion ?? null,
            tipo: item.tipo,
            naturaleza: item.naturaleza,
            padreId: padre?.id ?? null,
            nivel: padre ? padre.nivel + 1 : 1,
            permiteMovimientos: item.permiteMovimientos ?? true,
            activo: true,
          }),
        );
      }
      mapa.set(item.codigo, cuenta);
    }

    const hoy = new Date();
    const anio = hoy.getUTCFullYear();
    const mes = hoy.getUTCMonth() + 1;
    const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
    const fechaFin = `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
    const periodo = await this.upsert(
      manager,
      PeriodoContable,
      { anio, mes },
      {
        anio,
        mes,
        fechaInicio,
        fechaFin,
        estatus: 'abierto',
      },
    );

    const polizaRepo = manager.getRepository(Poliza);
    const folio = `POL-${anio}${String(mes).padStart(2, '0')}-0001`;
    const existente = await polizaRepo.findOne({ where: { folio } });
    if (existente) return;

    const banco = mapa.get('1102');
    const capital = mapa.get('3101');
    if (!banco || !capital) return;

    const poliza = await polizaRepo.save(
      polizaRepo.create({
        folio,
        fecha: fechaInicio,
        tipo: 'diario',
        concepto: 'Aporte de capital demo',
        estatus: 'contabilizada',
        periodoId: periodo.id,
        usuarioId: usuario?.id ?? 1,
        totalDebe: 10000,
        totalHaber: 10000,
      }),
    );

    const detalleRepo = manager.getRepository(PolizaDetalle);
    await detalleRepo.save([
      detalleRepo.create({
        polizaId: poliza.id,
        cuentaId: banco.id,
        concepto: 'Aporte a banco',
        debe: 10000,
        haber: 0,
        orden: 1,
      }),
      detalleRepo.create({
        polizaId: poliza.id,
        cuentaId: capital.id,
        concepto: 'Capital social',
        debe: 0,
        haber: 10000,
        orden: 2,
      }),
    ]);
  }

  private async seedDepartamento(manager: EntityManager) {
    return this.upsert(
      manager,
      Departamento,
      { nombre: 'Tecnología Dev' },
      {
        nombre: 'Tecnología Dev',
        descripcion: 'Departamento demo de desarrollo',
        activo: true,
      },
    );
  }

  private async seedPuesto(manager: EntityManager, departamento: Departamento) {
    return this.upsert(
      manager,
      Puesto,
      { nombre: 'Desarrollador Dev' },
      {
        nombre: 'Desarrollador Dev',
        descripcion: 'Puesto demo',
        salarioMinimo: 10000,
        salarioMaximo: 30000,
        departamentoId: departamento.id,
        activo: true,
      },
    );
  }

  private async seedTurno(manager: EntityManager) {
    await this.upsert(
      manager,
      Turno,
      { nombre: 'Turno semanal Dev' },
      {
        nombre: 'Turno semanal Dev',
        periodicidad: 'semanal',
        horaEntrada: '09:00',
        horaSalida: '18:00',
        horaComidaInicio: '14:00',
        horaComidaFin: '15:00',
        toleranciaMinutos: 10,
        diasLaborables: 'L,M,X,J,V',
        activo: true,
      },
    );

    await this.upsert(
      manager,
      Turno,
      { nombre: 'Turno quincenal Dev' },
      {
        nombre: 'Turno quincenal Dev',
        periodicidad: 'quincenal',
        horaEntrada: '08:00',
        horaSalida: '17:00',
        horaComidaInicio: '13:00',
        horaComidaFin: '14:00',
        toleranciaMinutos: 10,
        diasLaborables: 'L,M,X,J,V',
        activo: true,
      },
    );

    await this.upsert(
      manager,
      Turno,
      { nombre: 'Turno mensual Dev' },
      {
        nombre: 'Turno mensual Dev',
        periodicidad: 'mensual',
        horaEntrada: '10:00',
        horaSalida: '19:00',
        horaComidaInicio: '15:00',
        horaComidaFin: '16:00',
        toleranciaMinutos: 15,
        diasLaborables: 'L,M,X,J,V,S',
        activo: true,
      },
    );

    const weekly = await manager.getRepository(Turno).findOne({
      where: { nombre: 'Turno semanal Dev' },
    });
    if (!weekly)
      throw new Error('No se pudo crear el turno semanal de desarrollo');
    return weekly;
  }

  private async seedEmpleado(
    manager: EntityManager,
    departamento: Departamento,
    puesto: Puesto,
    turno: Turno,
  ) {
    const empleado = await this.upsert(
      manager,
      Empleado,
      { codigo: 'EMP-DEV-001' },
      {
        codigo: 'EMP-DEV-001',
        nombre: 'Ana',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'López',
        genero: 'F',
        fechaNacimiento: new Date('1992-05-20'),
        departamentoId: departamento.id,
        puestoId: puesto.id,
        turnoId: turno.id,
        fechaIngreso: new Date('2025-01-01'),
        salario: 20000,
        activo: true,
      },
    );
    if (empleado.turnoId !== turno.id) {
      empleado.turnoId = turno.id;
      return manager.getRepository(Empleado).save(empleado);
    }
    return empleado;
  }

  private async seedContrato(manager: EntityManager, empleado: Empleado) {
    const repo = manager.getRepository(Contrato);
    const existente = await repo.findOne({
      where: { empleadoId: empleado.id, tipo: 'indeterminado' },
    });
    if (!existente) {
      await repo.save(
        repo.create({
          empleadoId: empleado.id,
          tipo: 'indeterminado',
          fechaInicio: new Date('2025-01-01'),
          salario: 20000,
          activo: true,
        }),
      );
    }
  }

  private async seedAsistencia(manager: EntityManager, empleado: Empleado) {
    const repo = manager.getRepository(Asistencia);
    const existente = await repo.findOne({
      where: { empleadoId: empleado.id, observaciones: 'DEV-SEED' },
    });
    if (!existente) {
      await repo.save(
        repo.create({
          empleadoId: empleado.id,
          fecha: new Date('2026-06-02'),
          horaEntrada: '09:00:00',
          horaSalida: '18:00:00',
          estatus: 'presente',
          observaciones: 'DEV-SEED',
        }),
      );
    }
  }

  private async seedPoliticaVacacional(manager: EntityManager) {
    const repo = manager.getRepository(PoliticaVacacional);
    const existente = await repo.findOne({
      where: { aniosDesde: 1, aniosHasta: IsNull() },
    });
    if (!existente) {
      await repo.save(
        repo.create({
          aniosDesde: 1,
          aniosHasta: null,
          diasOtorgados: 12,
          activo: true,
        }),
      );
    }
  }

  private async seedEquipo(manager: EntityManager) {
    return this.upsert(
      manager,
      Equipo,
      { codigo: 'EQ-DEV-001' },
      {
        codigo: 'EQ-DEV-001',
        nombre: 'Equipo demo',
        descripcion: 'Equipo de ejemplo',
        estado: 'operativo',
        activo: true,
      },
    );
  }

  private async seedPlan(manager: EntityManager, equipo: Equipo) {
    return this.upsert(
      manager,
      PlanMantenimiento,
      { equipoId: equipo.id, descripcion: 'Mantenimiento mensual' },
      {
        equipoId: equipo.id,
        descripcion: 'Mantenimiento mensual',
        tipo: 'preventivo',
        periodicidad: 'mensual',
        intervalo: 1,
        activo: true,
      },
    );
  }

  private async seedRefaccion(manager: EntityManager, producto: Producto) {
    return this.upsert(
      manager,
      Refaccion,
      { codigo: 'REF-DEV-001' },
      {
        codigo: 'REF-DEV-001',
        nombre: 'Filtro demo',
        descripcion: 'Refacción de ejemplo',
        productoId: producto.id,
        stockMinimo: 1,
        activo: true,
      },
    );
  }

  private async seedOrden(
    manager: EntityManager,
    equipo: Equipo,
    plan: PlanMantenimiento,
    usuario: Usuarios | null,
  ) {
    const repo = manager.getRepository(OrdenTrabajo);
    let orden = await repo.findOne({ where: { folio: 'DEV-OT-0001' } });

    if (!orden) {
      orden = await repo.save(
        repo.create({
          folio: 'DEV-OT-0001',
          equipoId: equipo.id,
          planMantenimientoId: plan.id,
          descripcion: 'Revisión inicial de desarrollo',
          fechaProgramada: new Date('2026-03-01'),
          estatus: 'pendiente',
          solicitadoPor: usuario?.id,
        }),
      );
      await manager.getRepository(DetalleOrdenTrabajo).save(
        manager.getRepository(DetalleOrdenTrabajo).create({
          ordenTrabajoId: orden.id,
          descripcion: 'Revisión de componentes',
          completado: false,
        }),
      );
    }
  }

  private async seedMovimientoRefaccion(
    manager: EntityManager,
    refaccion: Refaccion,
    usuario: Usuarios | null,
  ) {
    const repo = manager.getRepository(MovimientoRefaccion);
    const existente = await repo.findOne({
      where: {
        refaccionId: refaccion.id,
        tipo: 'entrada',
        observaciones: 'Inventario inicial de refacción',
      },
    });
    if (!existente) {
      await repo.save(
        repo.create({
          refaccionId: refaccion.id,
          cantidad: 5,
          tipo: 'entrada',
          observaciones: 'Inventario inicial de refacción',
          usuarioId: usuario?.id,
        }),
      );
    }
  }

  private async seedComedor(
    manager: EntityManager,
    empleado: Empleado,
    turno: Turno | null,
  ) {
    if (!turno) return;

    const { start, end } = this.nextWeeklyPeriod(new Date());
    const menuRepo = manager.getRepository(MenuComedor);
    let menu = await menuRepo.findOne({
      where: { periodicidad: 'semanal', fechaInicio: start, fechaFin: end },
    });

    if (!menu) {
      menu = await menuRepo.save(
        menuRepo.create({
          nombre: `Menú semanal desarrollo ${this.dateKey(start)}`,
          periodicidad: 'semanal',
          fechaInicio: start,
          fechaFin: end,
          activo: true,
        }),
      );
    }

    const itemRepo = manager.getRepository(MenuComedorItem);
    const items: MenuComedorItem[] = [];
    for (let day = 0; day < 7; day++) {
      const fecha = new Date(start);
      fecha.setDate(start.getDate() + day);
      let item = await itemRepo.findOne({
        where: { menuId: menu.id, fecha, tipoComida: 'comida' },
      });
      if (!item) {
        item = await itemRepo.save(
          itemRepo.create({
            menuId: menu.id,
            fecha,
            tipoComida: 'comida',
            descripcion: `Comida demo del ${this.dateKey(fecha)}`,
            activo: true,
          }),
        );
      }
      items.push(item);
    }

    const solicitudRepo = manager.getRepository(SolicitudComedor);
    let solicitud = await solicitudRepo.findOne({
      where: { empleadoId: empleado.id, menuId: menu.id },
    });
    if (!solicitud) {
      solicitud = await solicitudRepo.save(
        solicitudRepo.create({
          empleadoId: empleado.id,
          menuId: menu.id,
          estatus: 'solicitada',
          observaciones: 'Solicitud demo del ambiente de desarrollo',
        }),
      );
    }

    const detalleRepo = manager.getRepository(SolicitudComedorDetalle);
    for (const item of items) {
      const existente = await detalleRepo.findOne({
        where: { solicitudId: solicitud.id, menuItemId: item.id },
      });
      if (!existente) {
        await detalleRepo.save(
          detalleRepo.create({
            solicitudId: solicitud.id,
            menuItemId: item.id,
          }),
        );
      }
    }
  }

  private nextWeeklyPeriod(today: Date) {
    const current = new Date(today);
    current.setHours(0, 0, 0, 0);
    const day = current.getDay() || 7;
    const start = new Date(current);
    start.setDate(current.getDate() + (8 - day));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  private dateKey(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private async seedChat(
    manager: EntityManager,
    admin: Usuarios | null,
    dev: Usuarios | null,
  ) {
    if (!admin || !dev) return;

    const conversacionRepo = manager.getRepository(Conversacion);
    let conversacion = await conversacionRepo.findOne({
      where: { nombre: 'Chat desarrollo' },
    });

    if (!conversacion) {
      conversacion = await conversacionRepo.save(
        conversacionRepo.create({ esGrupo: true, nombre: 'Chat desarrollo' }),
      );
    }

    const participanteRepo = manager.getRepository(ConversacionParticipante);
    for (const usuarioId of [admin.id, dev.id]) {
      const existente = await participanteRepo.findOne({
        where: { conversacionId: conversacion.id, usuarioId },
      });
      if (!existente) {
        await participanteRepo.save(
          participanteRepo.create({
            conversacionId: conversacion.id,
            usuarioId,
          }),
        );
      }
    }

    const mensajeRepo = manager.getRepository(Mensaje);
    const existenteMensaje = await mensajeRepo.findOne({
      where: { conversacionId: conversacion.id },
    });
    if (!existenteMensaje) {
      await mensajeRepo.save(
        mensajeRepo.create({
          conversacionId: conversacion.id,
          usuarioId: admin.id,
          contenido: 'Bienvenido al ambiente de desarrollo',
        }),
      );
    }
  }
}
