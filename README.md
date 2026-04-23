# ♻️ EcoBahía — Panel Administrativo (Frontend Web)

**EcoBahía** es la plataforma web centralizada para administradores y coordinadores de logística de recolección de residuos. Permite gestionar rutas, vehículos, conductores y monitorear en tiempo real la ubicación de los camiones en un mapa interactivo.

## 🧩 Rol en el sistema

| Componente | Función |
|---|---|
| 🌐 **Frontend Web** (este repo) | Panel admin: gestión + monitoreo en tiempo real en mapa |
| 🧠 Backend (Node.js + Express) | API REST + WebSockets. Centraliza lógica y BD |
| 📱 App móvil (Ionic/Angular) | Captura GPS del conductor y la envía en tiempo real |

---

## 🏗️ Estructura del proyecto

```text
frontend/src/
├── index.html                 ← HTML principal
├── main.ts                    ← Punto de entrada de la app
├── styles.scss                ← Estilos globales
│
├── environments/              ← Variables de entorno
│   ├── environment.ts         ← Desarrollo (localhost)
│   └── environment.prod.ts    ← Producción
│
└── app/
    ├── app.config.ts          ← Configuración (providers, interceptors, routing)
    ├── app.routes.ts          ← Definición de rutas Angular
    ├── app.ts / .html / .scss ← Componente raíz
    │
    ├── components/            ← Componentes UI reutilizables
    │   ├── confirm-dialog/    ← Modal de confirmación para acciones destructivas
    │   ├── header/            ← Barra de navegación superior fija
    │   ├── notification-container/ ← Contenedor flotante de notificaciones (toasts)
    │   ├── route/             ← Tarjeta de visualización de ruta
    │   ├── sidebar/           ← Menú lateral de navegación
    │   ├── progress-bar/      ← Barra de progreso
    │   └── stat-card/         ← Tarjeta de estadística
    │
    ├── guards/
    │   └── auth.guard.ts      ← Protección de rutas (requiere sesión activa)
    │
    ├── models/
    │   └── vehicle.ts         ← Interfaz de Vehículo
    │
    ├── pages/                 ← Vistas principales
    │   ├── login/             ← Inicio de sesión de administrador
    │   ├── dashboard/         ← Panel principal con resumen de operaciones
    │   ├── main/              ← Layout wrapper (Sidebar + Header + router-outlet)
    │   ├── mapa/              ← Mapa interactivo: crear rutas + tracking en vivo
    │   ├── asignaciones/      ← Gestión de recorridos (conductor ↔ vehículo ↔ ruta)
    │   ├── registro-conductores/ ← CRUD de conductores
    │   └── vehiculos/         ← CRUD de vehículos
    │
    └── services/              ← Lógica de negocio y comunicación
        ├── auth.service.ts    ← Autenticación y token JWT
        ├── http.interceptor.ts ← Inyección automática de JWT
        ├── notification.service.ts ← Mensajes toast
        ├── map.service.ts     ← Integración Leaflet (dibujar rutas, marcadores)
        ├── websocket.service.ts ← Conexión Socket.IO (escucha eventos GPS)
        ├── live-tracking.service.ts ← Estado reactivo de conductores en mapa
        ├── ruta/
        │   └── ruta.service.ts
        ├── vehiculo/
        │   └── vehiculo.service.ts
        ├── usuario/
        │   └── usuario.service.ts
        └── recorrido/
            └── recorrido.service.ts
```

---

## ✨ Funcionalidades principales

| Módulo | Descripción |
|---|---|
| 🗺️ **Mapa** | Dibujar rutas sobre calles reales (OSRM), ver camiones en vivo con tooltip premium |
| 🚛 **Vehículos** | CRUD completo sincronizado con API externa |
| 👤 **Conductores** | Registro y gestión de conductores |
| 🔗 **Asignaciones** | Vincular conductor↔vehículo y vehículo↔ruta, crear recorridos |
| 📍 **Tracking en vivo** | Ver conductores moviéndose en el mapa en tiempo real con burbuja informativa (placa + ruta) |
| 🌍 **Modo satélite** | Alternar entre mapa estándar (Google Maps) y vista satélite (ESRI) |
| 📊 **Dashboard** | Resumen de operaciones con mapa integrado en la página de inicio |

---

## 🚀 Ejecutar el proyecto

```bash
cd frontend
npm install
npm run start
# o: ng serve
```

Navega a `http://localhost:4200/`.

---

## 📡 Tracking en tiempo real

El mapa del panel web se conecta al backend por **Socket.IO** para recibir las posiciones GPS de los conductores:

- **Marcador premium**: Cada camión se muestra con un círculo azul animado (pulso GPS) y un ícono SVG de camión.
- **Tooltip flotante**: Sobre cada marcador aparece una burbuja blanca con el **nombre de la ruta** y la **placa del vehículo**, permitiendo identificar instantáneamente cada conductor.
- **Ruta activa**: Cuando un camión está en recorrido, se dibuja automáticamente la ruta asignada con estilo de 3 capas (glow + borde + línea principal).
- **Resolución de nombres**: La app cruza automáticamente los IDs de vehículos y rutas con sus datos completos para mostrar información legible.

