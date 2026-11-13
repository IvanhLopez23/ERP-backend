/**
 * Regla de negocio: todo ticket nace en el estado inicial del catálogo y,
 * al asignarle un técnico, avanza automáticamente al estado de asignado
 * únicamente si aún se encuentra en el estado inicial.
 */
export const TICKET_STATUS_INICIAL_ID = 1;
export const TICKET_STATUS_ASIGNADO_ID = 2;
export const TICKET_STATUS_RESUELTO_ID = 7;
export const TICKET_STATUS_CERRADO_ID = 9;

/**
 * Workflow: matriz de transiciones válidas entre estados.
 * Clave = estado origen (id del catálogo), valor = ids de destino permitidos.
 * Los estados terminales (Cancelado, Cerrado) no tienen salidas.
 *
 * Catálogo de referencia:
 *   1 Nuevo · 2 Asignado · 3 En Tránsito · 4 En Sitio · 5 Diagnóstico ·
 *   6 Espera de Refacción · 7 Resuelto · 8 Cancelado · 9 Cerrado
 */
export const TICKET_STATUS_TRANSICIONES: Readonly<
  Record<number, readonly number[]>
> = {
  1: [2, 8], // Nuevo -> Asignado | Cancelado
  2: [3, 4, 7, 8], // Asignado -> En Tránsito | En Sitio | Resuelto | Cancelado
  3: [4, 7, 8], // En Tránsito -> En Sitio | Resuelto | Cancelado
  4: [5, 6, 7, 8], // En Sitio -> Diagnóstico | Espera de Refacción | Resuelto | Cancelado
  5: [6, 7, 8], // Diagnóstico -> Espera de Refacción | Resuelto | Cancelado
  6: [3, 5, 7, 8], // Espera de Refacción -> En Tránsito (visita otro día) | Diagnóstico | Resuelto | Cancelado
  7: [5, 6, 9], // Resuelto -> Diagnóstico | Espera de Refacción (re-reporte) | Cerrado
  8: [], // Cancelado (terminal)
  9: [], // Cerrado (terminal)
};
