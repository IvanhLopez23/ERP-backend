/**
 * Pantallas del catálogo (`screens`) usadas por el RBAC de endpoints.
 * Los ids deben coincidir con la tabla `screens` del seed.
 */
export const SCREEN_TICKETS_ID = 13; // 'Incidentes'
export const SCREEN_KEDB_ID = 15; // 'Conocimiento KEDB' / Gestión de Problemas
export const SCREEN_SITES_ID = 22; // 'Sitio'
export const SCREEN_RACKS_ID = 28; // 'Gabinetes'
export const SCREEN_SERVERS_ID = 29; // 'Servidores'
export const SCREEN_WAREHOUSES_ID = 24; // 'Control de Almacenes'

/**
 * Mapeo pantalla -> segmentos de path de la API que le corresponden.
 * Lo consume el filtro `screenId` del consultor de auditoría
 * (GET /api/audit-trail). Los segmentos se comparan contra
 * split_part(path, '/', 2), salvo indicación especial.
 */
export const SCREEN_AUDIT_SEGMENTS: Record<number, readonly string[]> = {
  4: ['roles'], // Roles
  5: ['users'], // Usuarios
  6: ['permissions'], // Permisos
  7: ['access-logs'], // Bitácora de accesos
  8: ['screens'], // Pantallas
  10: ['itam'], // Inventario (ITMS): assets, rma, stock, transfers, warehouses
  11: ['cmms'], // Mantenimiento (CMMS): checklists, evidence, schedules, site-history, work-orders
  [SCREEN_TICKETS_ID]: ['tickets', 'ticket-timeline', 'ticket-evidence'], // Incidentes (+ timeline y evidencias)
  15: ['known-errors', 'problems'], // Conocimiento KEDB / Gestión de Problemas (ruta histórica + nueva)
  19: ['ticket-statuses'], // Estados
  20: ['ticket-categories'], // Categorias
  21: ['ticket-priorities'], // Prioridades
  [SCREEN_SITES_ID]: ['sites'], // Sitio
  [SCREEN_RACKS_ID]: ['racks'], // Gabinetes
  [SCREEN_SERVERS_ID]: ['servers'], // Servidores
};

/** Ids disponibles para el filtro, derivados del mapa (para mensajes de error/docs) */
export const SCREEN_AUDIT_IDS = Object.keys(SCREEN_AUDIT_SEGMENTS).map(Number);
