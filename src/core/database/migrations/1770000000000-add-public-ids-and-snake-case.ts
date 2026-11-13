import { MigrationInterface, QueryRunner } from 'typeorm';

const tables = [
  'usuarios',
  'perfil',
  'roles',
  'permisos',
  'pantallas',
  'bitacora_accesos',
  'refresh_tokens',
  'password_reset_tokens',
  'categorias_producto',
  'unidades_medida',
  'productos',
  'almacenes',
  'inventario',
  'movimientos_inventario',
  'proveedores',
  'compras',
  'detalles_compra',
  'equipos',
  'planes_mantenimiento',
  'ordenes_trabajo',
  'detalles_orden_trabajo',
  'refacciones',
  'movimientos_refacciones',
  'departamentos',
  'puestos',
  'empleados',
  'contratos',
  'asistencias',
  'politicas_vacacionales',
  'periodos_vacacionales',
  'solicitudes_permiso',
  'clientes',
  'cotizaciones',
  'detalles_cotizacion',
  'ventas',
  'detalles_venta',
  'conversaciones',
  'conversaciones_participantes',
  'mensajes',
];

const renames: Record<string, [string, string][]> = {
  usuarios: [
    ['nombreUsuario', 'nombre_usuario'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
    ['rolId', 'rol_id'],
  ],
  perfil: [
    ['apellidoPaterno', 'apellido_paterno'],
    ['apellidoMaterno', 'apellido_materno'],
    ['fechaNacimiento', 'fecha_nacimiento'],
    ['usuarioId', 'usuario_id'],
  ],
  roles: [
    ['esAdministrador', 'es_administrador'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  permisos: [
    ['pantallaId', 'pantalla_id'],
    ['rolId', 'rol_id'],
    ['fechaActualizacion', 'fecha_actualizacion'],
    ['usuarioId', 'usuario_id'],
  ],
  pantallas: [
    ['padreId', 'padre_id'],
    ['subMenu', 'sub_menu'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  bitacora_accesos: [
    ['fechaCreacion', 'fecha_creacion'],
    ['usuarioId', 'usuario_id'],
  ],
  refresh_tokens: [
    ['usuarioId', 'usuario_id'],
    ['expiresAt', 'expires_at'],
    ['createdAt', 'created_at'],
  ],
  password_reset_tokens: [
    ['usuarioId', 'usuario_id'],
    ['expiresAt', 'expires_at'],
    ['createdAt', 'created_at'],
  ],
  categorias_producto: [
    ['padreId', 'padre_id'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  unidades_medida: [
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  productos: [
    ['precioCosto', 'precio_costo'],
    ['precioVenta', 'precio_venta'],
    ['unidadMedidaId', 'unidad_medida_id'],
    ['categoriaId', 'categoria_id'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  almacenes: [
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  inventario: [
    ['productoId', 'producto_id'],
    ['almacenId', 'almacen_id'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  movimientos_inventario: [
    ['productoId', 'producto_id'],
    ['almacenId', 'almacen_id'],
    ['existenciaAnterior', 'existencia_anterior'],
    ['existenciaNueva', 'existencia_nueva'],
    ['usuarioId', 'usuario_id'],
    ['fechaCreacion', 'fecha_creacion'],
  ],
  proveedores: [
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  compras: [
    ['proveedorId', 'proveedor_id'],
    ['fechaCompra', 'fecha_compra'],
    ['usuarioId', 'usuario_id'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  detalles_compra: [
    ['compraId', 'compra_id'],
    ['productoId', 'producto_id'],
    ['precioUnitario', 'precio_unitario'],
  ],
  equipos: [
    ['fechaAdquisicion', 'fecha_adquisicion'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  planes_mantenimiento: [
    ['equipoId', 'equipo_id'],
    ['intervalo', 'intervalo'],
    ['fechaUltimoEjecucion', 'fecha_ultimo_ejecucion'],
    ['fechaProximaEjecucion', 'fecha_proxima_ejecucion'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  ordenes_trabajo: [
    ['folio', 'folio'],
    ['equipoId', 'equipo_id'],
    ['planMantenimientoId', 'plan_mantenimiento_id'],
    ['fechaProgramada', 'fecha_programada'],
    ['fechaEjecucion', 'fecha_ejecucion'],
    ['solicitadoPor', 'solicitado_por'],
    ['atendidoPor', 'atendido_por'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  detalles_orden_trabajo: [['ordenTrabajoId', 'orden_trabajo_id']],
  refacciones: [
    ['productoId', 'producto_id'],
    ['stockMinimo', 'stock_minimo'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  movimientos_refacciones: [
    ['refaccionId', 'refaccion_id'],
    ['ordenTrabajoId', 'orden_trabajo_id'],
    ['usuarioId', 'usuario_id'],
    ['fechaCreacion', 'fecha_creacion'],
  ],
  departamentos: [
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  puestos: [
    ['salarioMinimo', 'salario_minimo'],
    ['salarioMaximo', 'salario_maximo'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  empleados: [
    ['usuarioId', 'usuario_id'],
    ['apellidoPaterno', 'apellido_paterno'],
    ['apellidoMaterno', 'apellido_materno'],
    ['fechaNacimiento', 'fecha_nacimiento'],
    ['departamentoId', 'departamento_id'],
    ['puestoId', 'puesto_id'],
    ['fechaIngreso', 'fecha_ingreso'],
    ['fechaSalida', 'fecha_salida'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  contratos: [
    ['empleadoId', 'empleado_id'],
    ['fechaInicio', 'fecha_inicio'],
    ['fechaFin', 'fecha_fin'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  asistencias: [
    ['empleadoId', 'empleado_id'],
    ['horaEntrada', 'hora_entrada'],
    ['horaSalida', 'hora_salida'],
    ['fechaCreacion', 'fecha_creacion'],
  ],
  politicas_vacacionales: [
    ['aniosDesde', 'anios_desde'],
    ['aniosHasta', 'anios_hasta'],
    ['diasOtorgados', 'dias_otorgados'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  periodos_vacacionales: [
    ['empleadoId', 'empleado_id'],
    ['fechaInicio', 'fecha_inicio'],
    ['fechaFin', 'fecha_fin'],
    ['fechaLimiteDisfrute', 'fecha_limite_disfrute'],
    ['antiguedadAnios', 'antiguedad_anios'],
    ['diasOtorgados', 'dias_otorgados'],
    ['diasUsados', 'dias_usados'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  solicitudes_permiso: [
    ['empleadoId', 'empleado_id'],
    ['fechaInicio', 'fecha_inicio'],
    ['fechaFin', 'fecha_fin'],
    ['diasSolicitados', 'dias_solicitados'],
    ['periodoVacacionalId', 'periodo_vacacional_id'],
    ['aprobadoPor', 'aprobado_por'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  cotizaciones: [
    ['clienteId', 'cliente_id'],
    ['diasValidez', 'dias_validez'],
    ['vendedorId', 'vendedor_id'],
    ['usuarioId', 'usuario_id'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  detalles_cotizacion: [
    ['cotizacionId', 'cotizacion_id'],
    ['productoId', 'producto_id'],
    ['precioUnitario', 'precio_unitario'],
  ],
  ventas: [
    ['clienteId', 'cliente_id'],
    ['cotizacionId', 'cotizacion_id'],
    ['fechaVenta', 'fecha_venta'],
    ['vendedorId', 'vendedor_id'],
    ['usuarioId', 'usuario_id'],
    ['fechaCreacion', 'fecha_creacion'],
    ['fechaActualizacion', 'fecha_actualizacion'],
  ],
  detalles_venta: [
    ['ventaId', 'venta_id'],
    ['productoId', 'producto_id'],
    ['precioUnitario', 'precio_unitario'],
  ],
  conversaciones: [
    ['esGrupo', 'es_grupo'],
    ['fechaCreacion', 'fecha_creacion'],
  ],
  conversaciones_participantes: [
    ['conversacionId', 'conversacion_id'],
    ['usuarioId', 'usuario_id'],
    ['ultimaLectura', 'ultima_lectura'],
  ],
  mensajes: [
    ['conversacionId', 'conversacion_id'],
    ['usuarioId', 'usuario_id'],
    ['fechaCreacion', 'fecha_creacion'],
  ],
};

export class AddPublicIdsAndSnakeCase1770000000000 implements MigrationInterface {
  name = 'AddPublicIdsAndSnakeCase1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const versionRows = (await queryRunner.query(
      "SELECT current_setting('server_version_num') AS server_version_num",
    )) as Array<{ server_version_num: string }>;
    const version = versionRows[0]?.server_version_num;
    if (Number(version) < 180000) {
      throw new Error(
        'UUID v7 requiere PostgreSQL 18 o una estrategia de generación alternativa aprobada',
      );
    }

    for (const [table, columns] of Object.entries(renames)) {
      for (const [from, to] of columns) {
        if (
          from !== to &&
          (await queryRunner.hasColumn(table, from)) &&
          !(await queryRunner.hasColumn(table, to))
        ) {
          await queryRunner.query(
            `ALTER TABLE "${table}" RENAME COLUMN "${from}" TO "${to}"`,
          );
        }
      }
    }

    for (const table of tables) {
      if (!(await queryRunner.hasColumn(table, 'public_id'))) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ADD COLUMN "public_id" uuid`,
        );
      }
      await queryRunner.query(
        `UPDATE "${table}" SET "public_id" = uuidv7() WHERE "public_id" IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "public_id" SET DEFAULT uuidv7()`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "public_id" SET NOT NULL`,
      );
      const tableMetadata = await queryRunner.getTable(table);
      if (
        !tableMetadata?.uniques.some(
          (unique) => unique.name === `${table}_public_id_unique`,
        )
      ) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ADD CONSTRAINT "${table}_public_id_unique" UNIQUE ("public_id")`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [...tables].reverse()) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT "${table}_public_id_unique"`,
      );
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "public_id"`);
    }

    for (const [table, columns] of Object.entries(renames).reverse()) {
      for (const [from, to] of [...columns].reverse()) {
        if (from !== to) {
          await queryRunner.query(
            `ALTER TABLE "${table}" RENAME COLUMN "${to}" TO "${from}"`,
          );
        }
      }
    }
  }
}
