// =========================================================
// Modelo de dominio: Vehículo
// =========================================================

/** Vehículo tal como llega del backend */
export interface Vehiculo {
  id?: string;
  placa: string;
  marca: string;
  modelo: string;
  activo: boolean;
}

/** Payload para crear / actualizar un vehículo */
export interface CrearVehiculoPayload {
  placa: string;
  marca: string;
  modelo: string;
  activo: boolean;
  perfil_id: string;
}

/** Respuesta paginada del backend para vehículos */
export interface VehiculosResponse {
  msg?: string;
  data: Vehiculo[] | { current_page: number; data: Vehiculo[] };
}
