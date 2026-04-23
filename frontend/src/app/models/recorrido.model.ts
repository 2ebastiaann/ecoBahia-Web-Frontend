// =========================================================
// Modelo de dominio: Recorrido (Asignación de ruta)
// =========================================================

/** Recorrido tal como llega del backend */
export interface Recorrido {
  id: string;
  ruta_id: string;
  vehiculo_id: string;
  perfil_id: string;
  activo: boolean;
  // Campos enriquecidos por el backend (opcionales)
  vehiculo_placa?: string;
  vehiculo_marca?: string;
  conductor_nombre?: string;
  conductor_apellido?: string;
  nombre_ruta?: string;
}

/** Payload para crear un recorrido */
export interface CrearRecorridoPayload {
  ruta_id: string;
  vehiculo_id: string;
  perfil_id: string;
}
