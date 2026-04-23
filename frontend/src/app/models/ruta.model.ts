// =========================================================
// Modelo de dominio: Ruta
// =========================================================

/** Geometría de la ruta en formato GeoJSON */
export interface RutaShape {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat]
}

/** Ruta tal como llega del backend */
export interface Ruta {
  id: string;
  nombre_ruta: string;
  color_hex: string;
  shape: RutaShape | string; // puede venir como string JSON del backend
  perfil_id?: string;
}

/** Ruta ya procesada (shape parseado) para uso en componentes */
export interface RutaProcesada {
  id: string;
  nombre_ruta: string;
  color_hex: string;
  shape: RutaShape;
  perfil_id?: string;
}

/** Payload para crear una ruta */
export interface CrearRutaPayload {
  nombre_ruta: string;
  perfil_id: string;
  color_hex: string;
  shape: RutaShape;
}

/** Respuesta del backend para listado de rutas */
export interface RutasResponse {
  msg?: string;
  data: Ruta[];
}
