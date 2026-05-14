// environment.ts (desarrollo)
export const environment = {
  production: false,

  // ==========================================
  // 🔄 CAMBIA DE BACKEND AQUÍ
  // ==========================================
  
  // 1. Backend Local (Docker en tu PC)
  API_BASE_URL: 'http://localhost:3007/api',
  
  // 2. Backend en la Nube (Railway)
  // API_BASE_URL: 'https://ecobahia-backend-production.up.railway.app/api',

  PROF_API_BASE_URL: 'https://apirecoleccion.gonzaloandreslucio.com/api',
  PERFIL_ID: 'd1344313-5afa-40aa-b604-545ed54bd91b'
};