import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import * as L from 'leaflet';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { SidebarComponent } from '../../components/sidebar/sidebar';
import { HeaderComponent } from '../../components/header/header';
import { LiveTrackingService } from '../../services/live-tracking.service';
import { RecorridoService } from '../../services/recorrido/recorrido.service';
import { VehiculoService } from '../../services/vehiculo/vehiculo.service';
import { RutaService } from '../../services/ruta/ruta.service';
import { ReporteService } from '../../services/reporte/reporte.service';
import { WebSocketService, FotoData } from '../../services/websocket.service';
import { Recorrido, Vehiculo, RutaProcesada, Reporte } from '../../models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  templateUrl: './main.html',
  styleUrls: ['./main.scss']
})
export class MainComponent implements AfterViewInit, OnDestroy {

  sidebarOpen = true;
  activeSection = 'inicio';
  currentRoute = '';

  private previewMap?: L.Map;
  private mapInitialized = false;
  private mapInitInProgress = false;
  private mapInitTimeout?: ReturnType<typeof setTimeout>;
  private dataPollingInterval?: ReturnType<typeof setInterval>;

  // Capas
  private layerNormal!: L.TileLayer;
  private layerSatellite!: L.TileLayer;
  public isSatelliteMode = false;

  // Tracking en tiempo real
  private truckMarkers: { [conductorId: string]: L.Marker } = {};
  private activeRoutesPolylines: { [rutaId: string]: L.LayerGroup } = {};
  private photoMarkers: { [posicionId: string]: L.Marker } = {};
  private rutas: RutaProcesada[] = [];
  private recorridos: Recorrido[] = [];
  private vehiculos: Vehiculo[] = [];
  public activeTruckCount = 0;
  public activeRecorridos: { recorridoId: string | number; rutaNombre: string; placa: string; conductor: string }[] = [];

  // Modal foto
  public fotoModalUrl: string | null = null;

  // Reportes
  public reportes: Reporte[] = [];
  public selectedReporte: Reporte | null = null;

  private readonly destroy$ = new Subject<void>();
  /** Subject separado para la suscripción de tracking — se reinicia al re-crear el mapa */
  private readonly trackingDestroy$ = new Subject<void>();

  menuItems = [
    { id: 'inicio', label: 'Home', icon: 'icon-home' },
    { id: 'rutas', label: 'Rutas', icon: 'icon-route' },
    { id: 'asignaciones', label: 'Recorridos', icon: 'icon-settings' },
    { id: 'registro-conductores', label: 'Conductores', icon: 'icon-user' },
    { id: 'vehiculos', label: 'Vehículos', icon: 'icon-car' }
  ];

  constructor(
    private router: Router,
    private liveTrackingService: LiveTrackingService,
    private recorridoService: RecorridoService,
    private vehiculoService: VehiculoService,
    private rutaService: RutaService,
    private reporteService: ReporteService,
    private webSocketService: WebSocketService
  ) {
    this.currentRoute = this.router.url;

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;

        if (this.currentRoute === '/main') {
          // Limpiar timeout anterior si existe
          if (this.mapInitTimeout) {
            clearTimeout(this.mapInitTimeout);
          }
          // Reiniciar mapa solo si se vuelve a /main desde otra ruta
          this.mapInitialized = false;
          this.mapInitTimeout = setTimeout(() => this.initPreviewMap(), 100);
        }
      });
  }

  ngAfterViewInit(): void {
    this.mapInitTimeout = setTimeout(() => {
      if (this.currentRoute === '/main') {
        this.initPreviewMap();
      }
    }, 100);
    // Precarga datos para el tracking y configura polling
    this.liveTrackingService.iniciarMonitoreo();
    this.cargarDatosTracking();
    
    // Escuchar reportes en tiempo real
    this.webSocketService.nuevoReporte$
      .pipe(takeUntil(this.destroy$))
      .subscribe((nuevoReporte: Reporte) => {
        if (this.currentRoute === '/main') {
          this.reportes.unshift(nuevoReporte);
        }
      });

    // Escuchar fotos en tiempo real (conductor toma foto → aparece en el mapa)
    this.webSocketService.nuevaFoto$
      .pipe(takeUntil(this.destroy$))
      .subscribe((foto: FotoData) => {
        if (this.currentRoute === '/main' && this.previewMap) {
          this.agregarMarcadorFoto(foto.posicion_id, foto.lat, foto.lon, foto.capturado_ts);
        }
      });
    
    // Polling cada 10 segundos para saber si algún recorrido finalizó o empezó
    this.dataPollingInterval = setInterval(() => {
      if (this.currentRoute === '/main') {
        this.recorridoService.getRecorridos()
          .pipe(takeUntil(this.destroy$))
          .subscribe({ next: r => { this.recorridos = r; this.procesarDatosActualizados(); } });
        this.cargarReportes();
      }
    }, 10000);
  }

  ngOnDestroy(): void {
    this.trackingDestroy$.next();
    this.trackingDestroy$.complete();
    this.destroy$.next();
    this.destroy$.complete();
    if (this.mapInitTimeout) clearTimeout(this.mapInitTimeout);
    if (this.dataPollingInterval) clearInterval(this.dataPollingInterval);
    this.truckMarkers = {};
    this.activeRoutesPolylines = {};
    this.photoMarkers = {};
    this.destroyMap();
  }

  // ============================
  // ⭐  FIX DEFINITIVO LEAFLET
  // ============================
  private destroyMap(): void {
    if (this.previewMap) {
      try {
        this.previewMap.off();
        this.previewMap.remove();
      } catch (e) {
        // Ignorar errores al destruir
      }
      this.previewMap = undefined;
    }
    this.mapInitialized = false;
    this.mapInitInProgress = false;
  }

  private initPreviewMap(): void {
    if (this.mapInitInProgress) return;
    if (this.mapInitialized && this.previewMap) return;

    this.mapInitInProgress = true;

    try {
      const container = document.getElementById('mainMapPreview') as HTMLElement | null;
      if (!container) { this.mapInitInProgress = false; return; }

      if (this.previewMap) {
        try { this.previewMap.off(); this.previewMap.remove(); } catch (e) {}
        this.previewMap = undefined;
      }

      const leafletContainer = container as HTMLElement & { _leaflet_id?: number | null };
      if (leafletContainer._leaflet_id !== undefined) leafletContainer._leaflet_id = null;

      this.previewMap = L.map(container, { center: [3.8773, -77.0277], zoom: 13, maxZoom: 18 });

      this.layerNormal = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: '© Google Maps'
      });
      this.layerSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri', maxZoom: 19
      });

      this.layerNormal.addTo(this.previewMap);
      this.isSatelliteMode = false;
      this.mapInitialized = true;

      this.truckMarkers = {};
      this.activeRoutesPolylines = {};
      this.procesarDatosActualizados();
      this.escucharCamiones();
    } catch (e) {
      this.mapInitialized = false;
      this.previewMap = undefined;
    } finally {
      this.mapInitInProgress = false;
    }
  }

  // ===================================================
  // Tracking en Tiempo Real
  // ===================================================

  private cargarDatosTracking(): void {
    this.rutaService.getRutasProcesadas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: r => { this.rutas = r; this.procesarDatosActualizados(); }, error: () => {} });

    this.recorridoService.getRecorridos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: r => { this.recorridos = r; this.procesarDatosActualizados(); }, error: () => {} });

    this.vehiculoService.getVehiculosList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: v => { this.vehiculos = v; this.procesarDatosActualizados(); }, error: () => {} });

    this.cargarReportes();
  }

  private cargarReportes(): void {
    this.reporteService.getReportes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => this.reportes = r,
        error: () => {}
      });
  }

  private procesarDatosActualizados(): void {
    if (!this.recorridos || !this.vehiculos || !this.rutas) return;

    const recorridosActivos = this.recorridos.filter(r => r.activo);
    this.activeTruckCount = recorridosActivos.length;

    const anteriorIds = new Set(this.activeRecorridos.map(r => String(r.recorridoId)));
    const nuevoIds = new Set(recorridosActivos.map(r => String(r.id)));

    this.activeRecorridos = recorridosActivos.map(rec => {
      const veh = this.vehiculos.find(v => String(v.id) === String(rec.vehiculo_id));
      const ruta = this.rutas.find(r => String(r.id) === String(rec.ruta_id));
      return {
        recorridoId: rec.id,
        rutaNombre: ruta?.nombre_ruta || rec.nombre_ruta || 'Ruta desconocida',
        placa: veh?.placa || rec.vehiculo_placa || 'Sin placa',
        conductor: rec.conductor_nombre
          ? `${rec.conductor_nombre} ${rec.conductor_apellido || ''}`.trim()
          : 'Conductor asignado'
      };
    });

    // Cargar fotos de recorridos que acaban de activarse
    recorridosActivos.forEach(rec => {
      if (!anteriorIds.has(String(rec.id))) {
        this.cargarFotosRecorrido(String(rec.id));
      }
    });

    // Eliminar marcadores de foto de recorridos que ya terminaron
    if (this.previewMap) {
      Object.keys(this.photoMarkers).forEach(pid => {
        // Si no hay ningún recorrido activo que tenga esta posición, quitar el marcador
        // (se hace por deducción: si cambiaron los ids activos, limpiar todo y recargar)
        if (!nuevoIds.size && anteriorIds.size) {
          this.previewMap!.removeLayer(this.photoMarkers[pid]);
          delete this.photoMarkers[pid];
        }
      });
    }

    this.redrawActiveRoutes();
  }

  private escucharCamiones(): void {
    // Cancelar suscripción anterior (si el mapa fue re-creado)
    this.trackingDestroy$.next();

    this.liveTrackingService.activeTrucks$
      .pipe(takeUntil(this.trackingDestroy$))
      .subscribe(trucksMap => {
        if (!this.previewMap) return;

        // Eliminar camiones inactivos (que ya no envían GPS)
        Object.keys(this.truckMarkers).forEach(id => {
          if (!trucksMap.has(id)) {
            this.previewMap!.removeLayer(this.truckMarkers[id]);
            delete this.truckMarkers[id];
          }
        });

        // Actualizar/Crear marcadores de camiones activos (con GPS)
        trucksMap.forEach((data, conductorId) => {
          const latlng = L.latLng(data.latitude, data.longitude);
          let placa = '', nombreRuta = '';

          if (data.recorrido_id) {
            const rec = this.recorridos.find(r => String(r.id) === String(data.recorrido_id));
            if (rec) {
              const veh = this.vehiculos.find(v => String(v.id) === String(rec.vehiculo_id));
              placa = veh ? veh.placa : '';
              const ruta = this.rutas.find(r => String(r.id) === String(rec.ruta_id));
              nombreRuta = ruta ? ruta.nombre_ruta : '';
            }
          }

          if (!this.truckMarkers[conductorId]) {
            const icon = L.divIcon({
              html: this.makeTruckPinHtml(placa, nombreRuta),
              className: 'truck-marker-wrapper', iconSize: [52, 52], iconAnchor: [26, 26]
            });
            this.truckMarkers[conductorId] = L.marker(latlng, { icon, zIndexOffset: 1000 }).addTo(this.previewMap!);
          } else {
            this.truckMarkers[conductorId].setLatLng(latlng);
          }
        });
      });
  }

  // ===================================================
  // Fotos de posiciones
  // ===================================================

  private cargarFotosRecorrido(recorridoId: string): void {
    this.recorridoService.obtenerFotosRecorrido(recorridoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const fotos = res?.data || res || [];
          fotos.forEach((f: any) => {
            this.agregarMarcadorFoto(f.id, f.lat, f.lon, f.capturado_ts);
          });
        },
        error: () => {}
      });
  }

  agregarMarcadorFoto(posicionId: string, lat: number, lon: number, timestamp: string): void {
    if (!this.previewMap || this.photoMarkers[posicionId]) return;

    const icon = L.divIcon({
      html: this.makePhotoPinHtml(timestamp),
      className: 'photo-marker-wrapper',
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    const marker = L.marker([lat, lon], { icon, zIndexOffset: 900 }).addTo(this.previewMap);

    // Al hacer click, pedir la imagen al backend y mostrar modal
    const token = sessionStorage.getItem('token');
    marker.on('click', () => {
      fetch(`${environment.API_BASE_URL}/recorridos/posiciones/${posicionId}/imagen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(r => r.blob())
      .then(blob => {
        this.fotoModalUrl = URL.createObjectURL(blob);
      })
      .catch(() => {
        this.fotoModalUrl = null;
      });
    });

    this.photoMarkers[posicionId] = marker;
  }

  cerrarFotoModal(): void {
    if (this.fotoModalUrl) {
      URL.revokeObjectURL(this.fotoModalUrl);
      this.fotoModalUrl = null;
    }
  }

  private makePhotoPinHtml(timestamp: string): string {
    const hora = new Date(timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    return `
      <div style="
        position: relative; width: 36px; height: 36px; cursor: pointer;
        filter: drop-shadow(0 3px 8px rgba(0,0,0,0.4));
      ">
        <div style="
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(245,158,11,0.6);
        ">
          <span style="transform: rotate(45deg); font-size: 16px; line-height: 1;">📷</span>
        </div>
        <div style="
          position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,0.7); color: white;
          font-size: 9px; font-weight: 700; white-space: nowrap;
          padding: 2px 5px; border-radius: 4px;
          font-family: 'Inter', sans-serif;
        ">${hora}</div>
      </div>`;
  }

  private dibujarRutaActiva(recorridoId: string): void {
    if (!this.recorridos.length || !this.rutas.length || !this.previewMap) return;
    const rec = this.recorridos.find(r => String(r.id) === String(recorridoId));
    if (!rec) return;
    const rutaId = String(rec.ruta_id);
    if (this.activeRoutesPolylines[rutaId]) return;
    const ruta = this.rutas.find(r => String(r.id) === rutaId);
    if (!ruta?.shape?.coordinates) return;
    const coords = ruta.shape.coordinates.map((c: [number, number]) => L.latLng(c[1], c[0]));
    const lg = L.layerGroup().addTo(this.previewMap);
    // Glow + borde + línea principal
    L.polyline(coords, { color: 'rgba(74,144,255,0.35)', weight: 18, lineCap: 'round' }).addTo(lg);
    L.polyline(coords, { color: '#1a3a7a', weight: 10, opacity: 0.9, lineCap: 'round' }).addTo(lg);
    L.polyline(coords, { color: '#4A90FF', weight: 6, opacity: 1, lineCap: 'round' }).addTo(lg);
    // Punto de inicio (verde) y fin (rojo)
    if (coords.length > 0) {
      const startIcon = L.divIcon({
        html: this.makeRoutePointHtml('start', true),
        className: 'route-point-wrapper', iconSize: [28, 28], iconAnchor: [14, 14]
      });
      L.marker(coords[0], { icon: startIcon }).addTo(lg);
      if (coords.length > 1) {
        const endIcon = L.divIcon({
          html: this.makeRoutePointHtml('end', true),
          className: 'route-point-wrapper', iconSize: [28, 28], iconAnchor: [14, 14]
        });
        L.marker(coords[coords.length - 1], { icon: endIcon }).addTo(lg);
      }
    }
    this.activeRoutesPolylines[rutaId] = lg;
  }

  private makeRoutePointHtml(type: 'start' | 'end', isActive: boolean): string {
    const colors = {
      start: { bg: '#22c55e', border: '#16a34a', icon: '▶' },
      end:   { bg: '#ef4444', border: '#dc2626', icon: '■' }
    };
    const c = colors[type];
    return `
      <div style="width:28px;height:28px;background:${c.bg};border:3px solid ${c.border};border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 8px rgba(0,0,0,0.4),0 0 0 3px rgba(255,255,255,0.3);position:relative;">
        <span style="color:white;font-size:10px;font-weight:900;line-height:1;">${c.icon}</span>
      </div>
      ${isActive ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        width:28px;height:28px;border-radius:50%;background:${c.bg};opacity:0;
        animation:pointPulse 2s ease-out infinite;pointer-events:none;"></div>` : ''}
    `;
  }

  private redrawActiveRoutes(): void {
    if (!this.rutas.length || !this.recorridos.length || !this.previewMap) return;
    
    const rutasActivas = new Set<string>();

    this.recorridos.forEach(rec => {
      if (rec.activo) {
        rutasActivas.add(String(rec.ruta_id));
        this.dibujarRutaActiva(String(rec.id));
      }
    });

    // Limpiar rutas que ya no están activas en la BD
    Object.keys(this.activeRoutesPolylines).forEach(rutaId => {
      if (!rutasActivas.has(rutaId)) {
        this.previewMap!.removeLayer(this.activeRoutesPolylines[rutaId]);
        delete this.activeRoutesPolylines[rutaId];
      }
    });
  }

  private makeTruckPinHtml(placa?: string, rutaNombre?: string): string {
    const tooltip = (placa || rutaNombre) ? `
      <div style="position:absolute;bottom:55px;left:50%;transform:translateX(-50%);background:white;padding:6px 12px;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,0.2);font-family:'Inter',sans-serif;white-space:nowrap;display:flex;flex-direction:column;align-items:center;border:1px solid rgba(0,0,0,0.05);">
        ${rutaNombre ? `<span style="font-size:11px;font-weight:800;color:#4A90FF;text-transform:uppercase;">${rutaNombre}</span>` : ''}
        ${placa ? `<span style="font-size:12px;font-weight:700;color:#1e293b;">&#x1F69B; ${placa}</span>` : ''}
      </div>` : '';
    return `${tooltip}
      <div class="gps-pulse-ring"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;background:linear-gradient(135deg,#4A90FF,#357ABD);border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(74,144,255,0.5);z-index:10;">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
      </div>`;
  }

  toggleMapMode(): void {
    if (!this.previewMap) return;

    // Save current view
    const center = this.previewMap.getCenter();
    const zoom = this.previewMap.getZoom();

    this.isSatelliteMode = !this.isSatelliteMode;
    if (this.isSatelliteMode) {
      this.previewMap.removeLayer(this.layerNormal);
      this.layerSatellite.addTo(this.previewMap);
      this.previewMap.setMaxZoom(17);
    } else {
      this.previewMap.removeLayer(this.layerSatellite);
      this.layerNormal.addTo(this.previewMap);
      this.previewMap.setMaxZoom(18);
    }

    // Invalidate size without animation and restore view to prevent jump
    this.previewMap.invalidateSize({ animate: false });
    this.previewMap.setView(center, Math.min(zoom, this.previewMap.getMaxZoom()), { animate: false });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onSectionChange(section: string) {
    this.activeSection = section;

    if (section === 'mapa' || section === 'rutas') {
      this.router.navigate(['/main', 'mapa']);
    } else if (section === 'vehiculos') {
      this.router.navigate(['/main', 'vehiculos']);
    } else if (section === 'inicio' || section === 'main') {
      this.router.navigate(['/main']);
    } else if (section === 'registro-conductores') {
      this.router.navigate(['/main', 'registro-conductores']);
    } else if (section === 'asignaciones') {
      this.router.navigate(['/main', 'asignaciones']);
    }
  }

  verRutaActiva() {
    // temporalmente deshabilitado
    // this.router.navigate(['/main', 'mapa']);
  }

  verReportes() {
    // TODO: navegar a página de reportes cuando esté disponible
  }

  abrirReporte(reporte: Reporte): void {
    this.selectedReporte = reporte;
  }

  cerrarReporte(): void {
    this.selectedReporte = null;
  }

  abrirMapa() {
    this.router.navigate(['/main', 'mapa'], { queryParams: { create: '1' } });
  }

  getPorcentaje(recorridoId: string | number): number {
    const activeMap = (this.liveTrackingService as any).activeTrucksSubj?.value;
    if (!activeMap) return 0;
    
    // Buscar en el map el camión con ese recorrido_id
    for (const [conductorId, data] of activeMap.entries()) {
      if (String(data.recorrido_id) === String(recorridoId)) {
        return data.porcentaje_progreso || 0;
      }
    }
    return 0;
  }

  onLogout() {
    sessionStorage.removeItem('token');
    // también remuevo el usuario por si acaso, tal como en el authService
    sessionStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}
