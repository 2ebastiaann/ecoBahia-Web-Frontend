# ♻️ EcoBahía: Panel Administrativo (Frontend Web)

## 🌟 Introducción

**EcoBahía (Panel Administrativo)** es la plataforma centralizada web concebida específicamente para los administradores y coordinadores encargados de optimizar la logística de recolección de residuos. Está diseñada para mapear, monitorizar y gestionar las rutas y recorridos de los camiones de basura en la entidad u organización.

A través de **EcoBahía**, los coordinadores y administradores pueden tener control total sobre sus operaciones logísticas: permite dibujar trayectos precisos usando las calles de la ciudad, mantener un censo riguroso de la flota vehicular y de conductores autorizados, y finalmente, enlazar en tiempo real todo ello para activar y supervisar los **recorridos de recolección georeferenciados**.

---

## ✨ Bienvenido/a a EcoBahía

<img width="1024" height="1536" alt="20251101_2134_Logo EcoBahía Verde_simple_compose_01k916k1kaer0vh2x7y6kcqg9w" src="https://github.com/user-attachments/assets/c48fe575-10a1-4df7-8375-2b991620aaa4" />

---

## 🏗️ Arquitectura y Estructura del Frontend (Angular)

El código fuente de la aplicación Angular se encuentra dentro de la carpeta `frontend/src/`. La estructura del proyecto está organizada de la siguiente manera para mantener el código escalable, limpio y fácil de mantener:

```text
c:\Users\LENOVO\ecoBahia\frontend\src\
├── index.html                 ← Archivo HTML principal.
├── main.ts                    ← Punto de entrada de la aplicación, arranca el componente App.
├── styles.scss                 ← Hojas de estilo globales de la aplicación.
│
├── environments/              ← Variables de entorno para distintos ambientes.
│   ├── environment.ts         ← Entorno de desarrollo (URLs locales, tokens de prueba).
│   └── environment.prod.ts    ← Entorno de producción.
│
└── app/                       ← 📦 CÓDIGO PRINCIPAL DE LA APLICACIÓN
    ├── app.config.ts          ← Configuración principal (providers, interceptors y routing).
    ├── app.routes.ts          ← Archivo central de definición de rutas Angular.
    ├── app.ts / .html / .scss ← Componente raíz (App Component) que envuelve toda la app.
    │
    ├── components/            ← Componentes UI reutilizables (Smart/Dumb components)
    │   ├── confirm-dialog/    ← Modal global para confirmación de acciones destructivas.
    │   ├── header/            ← Barra de navegación superior fija en toda la aplicación.
    │   ├── notification-container/ ← Contenedor flotante para desplegar notificaciones (toasts).
    │   ├── route/             ← Tarjeta de visualización individual para rutas en listas.
    │   ├── sidebar/           ← Barra lateral de menú y navegación por submódulos.
    │   ├── progress-bar/      ← Barra de progreso (para uso futuro en estadísticas).
    │   └── stat-card/         ← Tarjeta de estadística (para uso futuro en el dashboard).
    │
    ├── guards/                ← Guardianes de rutas (seguridad)
    │   └── auth.guard.ts      ← Bloquea rutas protegidas si el usuario no tiene una sesión activa.
    │
    ├── models/                ← Interfaces y Clases de tipado estricto (TypeScript)
    │   └── vehicle.ts         ← Definición la estructura de datos para objetos tipo Vehículo.
    │
    ├── pages/                 ← Componentes principales de página (Vistas enrutables)
    │   ├── asignaciones/      ← Gestión de recorridos (vincular conductores con vehículos y rutas).
    │   ├── dashboard/         ← Panel principal e inicio, vista resumen de operaciones.
    │   ├── login/             ← Página de inicio de sesión de administrador.
    │   ├── main/              ← Layout wrapper (envuelve el router-outlet con Sidebar y Header).
    │   ├── mapa/              ← Gestión cartográfica, creación y visualización de rutas geográficas.
    │   ├── registro-conductores/ ← CRUD completo de base de datos de conductores.
    │   └── vehiculos/         ← CRUD completo de base de datos para la flota de vehículos.
    │
    └── services/              ← Lógica de negocio, estado global y peticiones HTTP
        ├── auth.service.ts    ← Gestiona autenticación, login y el token JWT en base al backend.
        ├── http.interceptor.ts ← Inyecta automáticamente el JWT y captura errores.
        ├── live-tracking.service.ts ← Estado global reactivo para el rastreo en vivo de conductores.
        ├── map.service.ts     ← Integración de Leaflet, pintura estática de rutas.
        ├── notification.service.ts ← Inyectable para emitir mensajes (toasts).
        ├── websocket.service.ts ← Conexión Socket.IO con el backend y escucha de eventos GPS.
        ├── ruta/
        │   └── ruta.service.ts ← Endpoints REST para rutas.
        ├── vehiculo/
        │   └── vehiculo.service.ts ← Endpoints REST para vehículos.
        ├── usuario/
        │   └── usuario.service.ts ← Endpoints REST para usuarios y perfiles.
        └── recorrido/
            └── recorrido.service.ts ← Endpoints REST para recorridos locales y foráneos.
```

### 📍 Monitoreo y Limpieza Reactiva en Tiempo Real
La aplicación cuenta con un módulo de **Tracking en Vivo** (Live Tracking) para el monitoreo de la flota:
1. **`WebSocketService`**: Mantiene un túnel bidireccional con el Backend Node.js. Autentica vía JWT. Escucha eventos crudos `location:update` y `conductor:disconnected`.
2. **`LiveTrackingService`**: Recibe los eventos del Socket y mantiene un estado en memoria (`BehaviorSubject<Map>`). Si un camión envía su ubicación, la guarda. Si el camión se desconecta o finaliza, lo elimina de memoria al instante.
3. **Interacción con el Mapa**: En `mapa.ts`, el componente escucha este servicio. Al actualizarse, dibuja los marcadores de los camiones y las polilíneas de la ruta en la que están. Si `LiveTrackingService` elimina un camión, el mapa retira sus componentes gráficos del DOM en milisegundos, garantizando un mapa siempre exacto y limpio.

### Ejecutar el Proyecto Frontend

Para iniciar el servidor de desarrollo, colócate dentro de `/frontend/` y corre:
```bash
npm run start
# o también: ng serve
```
Y navega en tu explorador hacia `http://localhost:4200/`.
