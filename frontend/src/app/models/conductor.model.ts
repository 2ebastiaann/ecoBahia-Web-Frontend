// =========================================================
// Modelo de dominio: Conductor (Usuario con rol conductor)
// =========================================================

/** Conductor tal como llega del backend */
export interface Conductor {
  id_usuario?: string;
  email: string;
  nombre: string;
  apellido: string;
}

/** Payload para crear un conductor (registro con id_rol = 2) */
export interface CrearConductorPayload {
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  id_rol?: number;
}

/** Payload para actualizar un conductor */
export interface ActualizarConductorPayload {
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
}
