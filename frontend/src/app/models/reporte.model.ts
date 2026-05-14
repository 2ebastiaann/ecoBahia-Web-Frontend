// =========================================================
// Modelo de dominio: Reporte
// =========================================================

export interface Reporte {
  id: string;
  nombre: string;
  email: string;
  usuario_id?: string;
  reporte: string;
  imagen_base64?: string;
  creado_en: string;
  // Joins del backend
  usuario_nombre?: string;
  usuario_apellido?: string;
}
