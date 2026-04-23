// =========================================================
// Modelo de dominio: Usuario / Autenticación
// =========================================================

/** Usuario autenticado almacenado en sesión */
export interface Usuario {
  id_usuario: string;
  email: string;
  id_rol: number;
}

/** Respuesta del endpoint /login */
export interface LoginResponse {
  ok: boolean;
  token: string;
  usuario: Usuario;
}

/** Respuesta genérica del endpoint /register */
export interface RegisterResponse {
  ok: boolean;
  msg?: string;
}
