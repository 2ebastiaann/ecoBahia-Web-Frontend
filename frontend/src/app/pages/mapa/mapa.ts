import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { RutaService } from '../../services/ruta/ruta.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationContainerComponent } from '../../components/notification-container/notification-container.component';
import { RutaProcesada, RutaShape, CrearRutaPayload, Usuario, Recorrido } from '../../models';
import { LiveTrackingService } from '../../services/live-tracking.service';
import { RecorridoService } from '../../services/recorrido/recorrido.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NotificationContainerComponent],
  templateUrl: './mapa.html',
  styleUrls: ['./mapa.scss']
})
export class MapaComponent implements AfterViewInit, OnDestroy, OnInit {

  map!: L.Map;

  // Modal
  mostrarModalNombreRuta = false;
  nombreRuta = '';

  // Crear rutas manualmente con puntos
  creandoRuta = false;
  puntosRuta: L.LatLng[] = [];
  coordenadasEnrutadas: L.LatLng[] = [];
  polyline: L.Polyline | null = null;
  marcadores: L.Marker[] = [];
  
  // Real-time tracking
  private truckMarkers: { [conductorId: string]: L.Marker } = {};
  private activeRoutesPolylines: { [rutaId: string]: L.LayerGroup } = {};
  
  recorridos: Recorrido[] = [];

  // rutas cargadas
  rutas: RutaProcesada[] = [];
  rutaSeleccionada: RutaProcesada | null = null;

  usuario: Usuario | null = null;
  esAdmin = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private rutaService: RutaService,
    public router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private notificationService: NotificationService,
    private liveTrackingService: LiveTrackingService,
    private recorridoService: RecorridoService
  ) {}

  // ===================================================
  // Inicialización
  // ===================================================

  ngOnInit(): void {
    this.usuario = this.auth.obtenerUsuario();
    if (this.usuario) {
      this.esAdmin = this.usuario.id_rol === 1;
    }

    this.cargarRutas();
    this.cargarRecorridos();
    this.liveTrackingService.iniciarMonitoreo();
  }

  ngAfterViewInit(): void {
    this.initMap();
    setTimeout(() => this.map.invalidateSize(), 200);
    this.escucharCamiones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // No detenemos el monitoreo global para no perder la memoria de camiones activos,
    // pero sí debemos limpiar las referencias a los objetos del mapa local destruido.
    this.truckMarkers = {};
    this.activeRoutesPolylines = {};
    if (this.map) this.map.remove();
  }

  // ===================================================
  // Map
  // ===================================================

  layerNormal!: L.TileLayer;
  layerSatellite!: L.TileLayer;
  isSatelliteMode = false;

  private initMap(): void {
    this.map = L.map('mapContainer', {
      center: [3.8773, -77.0277],
      zoom: 14,
      maxZoom: 18
    });

    // Layer Normal
    this.layerNormal = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    
    // Layer Satélite (Usando ESRI World Imagery que es gratuito y sin API key)
    this.layerSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    });

    this.layerNormal.addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));
  }

  toggleMapMode(): void {
    this.isSatelliteMode = !this.isSatelliteMode;
    if (this.isSatelliteMode) {
      this.map.removeLayer(this.layerNormal);
      this.layerSatellite.addTo(this.map);
      this.map.setMaxZoom(17); // Límite inferior para satélite
    } else {
      this.map.removeLayer(this.layerSatellite);
      this.layerNormal.addTo(this.map);
      this.map.setMaxZoom(18); // Límite para normal (OSM no carga más allá)
    }
    setTimeout(() => this.map.invalidateSize(), 100);
  }

  // Genera HTML SVG para el pin de ruta. Color en formato HEX y tamaño en px (cuadrado).
  private makePinHtml(color: string, size = 36): string {
    // SVG: pin con gradiente y centro blanco para destacar, escala responsiva al tamaño dado
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" class="route-pin-svg-el">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="1" />
            <stop offset="100%" stop-color="#7af3bf" stop-opacity="0.95" />
          </linearGradient>
          <filter id="f" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${color}" flood-opacity="0.5" />
          </filter>
        </defs>
        <!-- pin shape -->
        <path d="M12 2C8.686 2 6 4.686 6 8c0 4.667 6 12 6 12s6-7.333 6-12c0-3.314-2.686-6-6-6z" fill="url(#g)" filter="url(#f)"/>
        <!-- inner circle -->
        <circle cx="12" cy="8" r="2.6" fill="#ffffff" />
      </svg>
    `;

    return svg;
  }

  // Genera HTML SVG para el pin del camión recolector
  private makeTruckPinHtml(): string {
    return `
      <div style="background-color: #f9a03f; border: 2px solid white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: all 0.3s ease;">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      </div>
    `;
  }

  // ===================================================
  // Tracking en Tiempo Real
  // ===================================================

  private escucharCamiones(): void {
    this.liveTrackingService.activeTrucks$
      .pipe(takeUntil(this.destroy$))
      .subscribe((trucksMap) => {
        if (!this.map) return;

        // 1. Eliminar camiones que ya no están activos
        Object.keys(this.truckMarkers).forEach(conductorId => {
          if (!trucksMap.has(conductorId)) {
            this.map.removeLayer(this.truckMarkers[conductorId]);
            delete this.truckMarkers[conductorId];
          }
        });

        // 2. Determinar rutas necesarias y eliminar las sobrantes
        const rutasActivasActuales = new Set<string>();

        trucksMap.forEach((data, conductorId) => {
          const latlng = L.latLng(data.latitude, data.longitude);
          
          if (!this.truckMarkers[conductorId]) {
            // Crear nuevo camión
            const iconHtml = this.makeTruckPinHtml();
            const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
            const marker = L.marker(latlng, { icon, zIndexOffset: 1000 }).addTo(this.map);
            this.truckMarkers[conductorId] = marker;
          } else {
            // Actualizar posición del camión existente
            this.truckMarkers[conductorId].setLatLng(latlng);
          }
          
          // Dibujar la ruta asignada si no está dibujada
          if (data.recorrido_id) {
            const recorrido = this.recorridos.find(r => String(r.id) === String(data.recorrido_id));
            if (recorrido) {
              rutasActivasActuales.add(String(recorrido.ruta_id));
              this.dibujarRutaActiva(data.recorrido_id);
            }
          }
        });

        // 3. Limpiar rutas que ya ningún camión está recorriendo
        Object.keys(this.activeRoutesPolylines).forEach(rutaId => {
          if (!rutasActivasActuales.has(rutaId)) {
            this.map.removeLayer(this.activeRoutesPolylines[rutaId]);
            delete this.activeRoutesPolylines[rutaId];
          }
        });
      });
  }

  private dibujarRutaActiva(recorridoId: string): void {
    if (!this.recorridos.length || !this.rutas.length || !this.map) return;

    const recorrido = this.recorridos.find(r => String(r.id) === String(recorridoId));
    if (!recorrido) return;

    const rutaId = String(recorrido.ruta_id);
    
    // Si la ruta ya está dibujada (en activeRoutesPolylines), no hacer nada
    if (this.activeRoutesPolylines[rutaId]) return;

    const ruta = this.rutas.find(r => String(r.id) === rutaId);
    if (!ruta || !ruta.shape?.coordinates) return;

    const coords = ruta.shape.coordinates.map(
      (c: [number, number]) => L.latLng(c[1], c[0])
    );

    const layerGroup = L.layerGroup().addTo(this.map);

    const polyline = L.polyline(coords, {
      color: ruta.color_hex || '#10b981',
      weight: 5
    }).addTo(layerGroup);

    if (coords.length > 0) {
      const color = ruta.color_hex || '#10b981';
      const pinHtml = this.makePinHtml(color, 30);
      const icon = L.divIcon({ html: pinHtml, className: 'route-pin-icon route-pin-svg', iconSize: [30, 30], iconAnchor: [15, 30] });

      L.marker(coords[0], { icon }).addTo(layerGroup);
      if (coords.length > 1) {
        L.marker(coords[coords.length - 1], { icon }).addTo(layerGroup);
      }
    }

    this.activeRoutesPolylines[rutaId] = layerGroup;
  }

  // ===================================================
  // Cargar rutas desde API
  // ===================================================

  private cargarRutas(): void {
    this.rutaService.getRutasProcesadas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rutas: RutaProcesada[]) => {
          this.rutas = rutas;
          this.redrawActiveTruckRoutes();
        },
        error: () => {}
      });
  }

  private cargarRecorridos(): void {
    this.recorridoService.getRecorridos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recorridos) => {
          this.recorridos = recorridos;
          this.redrawActiveTruckRoutes();
        },
        error: () => {}
      });
  }

  // Se llama cuando rutas o recorridos terminan de cargar, para repintar las rutas de los camiones activos
  // que pudieron haber sido omitidas porque los datos no estaban listos
  private redrawActiveTruckRoutes(): void {
    // Si todavía no tenemos ambos, no hacemos nada
    if (!this.rutas.length || !this.recorridos.length) return;
    
    // Obtener los camiones activos actuales del servicio
    // y forzar el dibujado de sus rutas
    const activeMap = (this.liveTrackingService as any).activeTrucksSubj?.value;
    if (activeMap) {
      activeMap.forEach((data: any) => {
        if (data.recorrido_id) {
          this.dibujarRutaActiva(data.recorrido_id);
        }
      });
    }
  }

  // ===================================================
  // Crear rutas
  // ===================================================

  empezarCrearRuta(): void {
    if (!this.esAdmin) return;
    this.mostrarModalNombreRuta = true;
  }

  confirmarNombreRuta(): void {
    if (!this.esAdmin) return;

    if (!this.nombreRuta.trim()) {
      this.notificationService.warning("Debe ingresar un nombre.");
      return;
    }

    this.creandoRuta = true;
    this.mostrarModalNombreRuta = false;
    this.limpiarMapa();
  }

  cancelarCreacion(): void {
    this.creandoRuta = false;
    this.nombreRuta = '';
    this.limpiarMapa();
  }

  private onMapClick(e: L.LeafletMouseEvent): void {
    if (!this.creandoRuta || !this.esAdmin) return;

    const punto = e.latlng;
    this.puntosRuta.push(punto);

    // Usar SVG personalizado para que el pin sea más notable y con la estética del proyecto
    const pinColor = '#10b981';
    const pinHtml = this.makePinHtml(pinColor, 36);
    const icon = L.divIcon({ html: pinHtml, className: 'route-pin-icon route-pin-svg', iconSize: [36, 36], iconAnchor: [18, 36] });
    const marker = L.marker(punto, { icon }).addTo(this.map);

    this.marcadores.push(marker);

    if (this.puntosRuta.length === 1) {
      this.polyline = L.polyline([], {
        color: '#10b981',
        weight: 4,
        opacity: 0.9,
        dashArray: '0',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(this.map);
    } else {
      this.trazarRutaPorCalles();
    }
  }

  private async trazarRutaPorCalles(): Promise<void> {
    if (this.puntosRuta.length < 2) return;

    // OSRM espera las coordenadas en formato lng,lat separadas por ';'
    const coords = this.puntosRuta.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      const data: { code: string; routes: { geometry: { coordinates: [number, number][] } }[] } = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // La API devuelve geojson en formato [lng, lat]
        const geojsonCoordinates = data.routes[0].geometry.coordinates;

        // Convertir a L.LatLng para Leaflet
        this.coordenadasEnrutadas = geojsonCoordinates.map((c: [number, number]) => L.latLng(c[1], c[0]));

        if (this.polyline) {
          this.polyline.setLatLngs(this.coordenadasEnrutadas);
        }
      } else {
        this.notificationService.warning("No se pudo hallar ruta válida por calles.");
        // Fallback: trazar línea recta
        this.coordenadasEnrutadas = [...this.puntosRuta];
        if (this.polyline) this.polyline.setLatLngs(this.coordenadasEnrutadas);
      }
    } catch (e) {
      // Fallback
      this.coordenadasEnrutadas = [...this.puntosRuta];
      if (this.polyline) this.polyline.setLatLngs(this.coordenadasEnrutadas);
    }
  }

  // ===================================================
  // Guardar ruta
  // ===================================================

  guardarRuta(): void {
    if (!this.esAdmin) return;

    if (this.puntosRuta.length < 2) {
      this.notificationService.warning("Debes marcar al menos 2 puntos.");
      return;
    }

    const puntosFinales = this.coordenadasEnrutadas.length > 0
      ? this.coordenadasEnrutadas
      : this.puntosRuta;

    const shape: RutaShape = {
      type: 'LineString',
      coordinates: puntosFinales.map(
        (p: L.LatLng): [number, number] => [p.lng, p.lat]
      )
    };

    const payload: CrearRutaPayload = {
      perfil_id: this.rutaService.getPerfilId(),
      nombre_ruta: this.nombreRuta,
      color_hex: '#10b981',
      shape
    };

    this.rutaService.crearRuta(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success("Ruta creada exitosamente ✓");
          
          // Guardar la ruta recién creada en memoria para mostrarla sin esperar GET
          const rutaLocal: RutaProcesada = {
            nombre_ruta: this.nombreRuta,
            color_hex: '#10b981',
            shape: shape,
            id: Date.now().toString() // ID temporal
          };
          
          this.rutas.push(rutaLocal);
          this.creandoRuta = false;
          this.nombreRuta = '';
          this.limpiarMapa();
          
          // Recargar desde el servidor (para actualizaciones de otros usuarios)
          setTimeout(() => this.cargarRutas(), 1000);
        },
        error: () => {
          this.notificationService.error("Error al guardar la ruta");
        }
      });
  }

  // ===================================================
  // Ver ruta
  // ===================================================

  mostrarRuta(r: RutaProcesada): void {
    if (!r.shape?.coordinates || r.shape.coordinates.length < 2) {
      this.notificationService.error("Ruta dañada o incompleta.");
      return;
    }

    // Primero limpiar el mapa
    this.limpiarMapa();

    // Luego dibujar
    const coords = r.shape.coordinates.map(
      (c: [number, number]) => L.latLng(c[1], c[0])
    );

    this.polyline = L.polyline(coords, {
      color: r.color_hex || '#10b981',
      weight: 5
    }).addTo(this.map);

    // Dibujar puntos (solo inicio y fin para no saturar con los cientos de puntos generados por las calles)
    if (coords.length > 0) {
      const color = r.color_hex || '#10b981';
      const pinHtml = this.makePinHtml(color, 30);
      const icon = L.divIcon({ html: pinHtml, className: 'route-pin-icon route-pin-svg', iconSize: [30, 30], iconAnchor: [15, 30] });

      const mStart = L.marker(coords[0], { icon }).addTo(this.map);
      this.marcadores.push(mStart);

      if (coords.length > 1) {
        const mEnd = L.marker(coords[coords.length - 1], { icon }).addTo(this.map);
        this.marcadores.push(mEnd);
      }
    }

    setTimeout(() => {
      this.map.invalidateSize();
      this.map.fitBounds(this.polyline!.getBounds(), { padding: [40, 40] });
    }, 150);
  }

  // ===================================================
  // Limpiar
  // ===================================================

  limpiarMapa(): void {
    this.puntosRuta = [];
    this.coordenadasEnrutadas = [];

    if (this.polyline) {
      this.map.removeLayer(this.polyline);
      this.polyline = null;
    }

    this.marcadores.forEach(m => this.map.removeLayer(m));
    this.marcadores = [];
    
    // Limpiar rutas de tracking activo (si el usuario limpia el mapa manualmente)
    Object.values(this.activeRoutesPolylines).forEach(lg => this.map.removeLayer(lg));
    this.activeRoutesPolylines = {};
  }
}
