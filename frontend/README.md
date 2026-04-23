# 🌊 EcoBahía - Dashboard Administrativo (Web)

Bienvenido al repositorio del Frontend Administrativo de **EcoBahía**, un sistema integral para la gestión, despacho y monitoreo de recorridos de recolección de residuos sólidos urbanos.

## 🌟 Funcionalidades Principales

*   **📍 Monitoreo en Tiempo Real (Live Tracking):** Utiliza Leaflet y Socket.IO para visualizar en vivo la posición exacta de cada camión recolector en la ciudad.
*   **🧹 Limpieza Reactiva (Memory-First):** El mapa dibuja y elimina dinámicamente marcadores de camiones y polilíneas de rutas apenas el conductor finaliza su recorrido o se desconecta, sin necesidad de recargar la página.
*   **🗺️ Rutas y Geometría:** Visualización de rutas asignadas y posibilidad de gestionar el catálogo de recorridos.
*   **🚚 Despacho y Asignaciones:** Interfaz limpia e intuitiva para asignar Conductores, Vehículos y Rutas, validando que no existan conflictos de disponibilidad en tiempo real.
*   **🔒 Seguridad:** Integración JWT mediante Interceptores de Angular (`AuthInterceptor`) para proteger las operaciones contra la API.

## 🛠️ Stack Tecnológico

| Tecnología | Rol en el Proyecto |
| :--- | :--- |
| **Angular 16+** | Framework SPA y reactividad de UI |
| **RxJS** | Gestión de flujos asíncronos (`BehaviorSubject`, `takeUntil`) |
| **Leaflet** | Renderizado cartográfico y geometría GeoJSON |
| **Socket.IO Client** | Recepción de eventos push `location:update` y `conductor:disconnected` |
| **TypeScript** | Tipado estricto en modelos y payloads |

## 🏗️ Arquitectura de Servicios de Tracking

El monitoreo "en vivo" está orquestado por tres pilares fundamentales:

1.  **`WebSocketService`**: Mantiene la conexión (pipeline de datos) con el Backend Node.js de manera persistente y autenticada. Traduce los eventos crudos del socket en Observables de RxJS.
2.  **`LiveTrackingService`**: Actúa como el "cerebro" o estado global. Almacena en un `BehaviorSubject<Map<...>>` las ubicaciones activas. Si un camión envía datos, lo actualiza; si se desconecta, lo elimina automáticamente y emite el nuevo estado a los componentes.
3.  **`MapaComponent`**: Exclusivamente enfocado en renderizado. Escucha pasivamente a `LiveTrackingService` e inyecta o elimina instancias de `L.Marker` y `L.Polyline` del DOM del mapa. Posee reglas estrictas en el `ngOnDestroy` para purgar referencias de memoria si el usuario cambia de pestaña.

## 🚀 Cómo ejecutar el proyecto

```bash
# Instalar dependencias
npm install

# Levantar entorno de desarrollo (con Hot Reload)
ng serve
```

Navega a `http://localhost:4200/`. La aplicación recargará la vista si realizas cambios en los archivos fuente.

## 🔌 Integración con el Ecosistema

Este Dashboard funciona en armonía con:
*   **EcoBahía Backend**: Provee los endpoints REST y el túnel WebSocket.
*   **EcoBahía Conductor (Mobile)**: App móvil que emite las coordenadas que este dashboard visualiza en tiempo real.
