import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { ApiService, RutaShape, CrearRutaPayload } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationContainerComponent } from '../../components/notification-container/notification-container.component';

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

  // rutas cargadas
  rutas: any[] = [];
  rutaSeleccionada: any = null;

  usuario: any;
  esAdmin = false;

  constructor(
    private api: ApiService,
    public router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private notificationService: NotificationService
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
  }

  ngAfterViewInit(): void {
    this.initMap();
    setTimeout(() => this.map.invalidateSize(), 200);
  }

  ngOnDestroy(): void {
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
      zoom: 14
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
      this.map.setMaxZoom(19); // Límite por defecto para normal
    }
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

  // ===================================================
  // Cargar rutas desde API
  // ===================================================

  private cargarRutas(): void {
    this.api.getRutas().subscribe({
      next: (resp: any) => {
        const lista = Array.isArray(resp?.data) ? resp.data : resp;

        this.rutas = lista.map((r: any) => {
          let shape = typeof r.shape === 'string' ? JSON.parse(r.shape) : r.shape;
          
          // ⚠️ El backend transforma LineString a MultiLineString
          // Si es MultiLineString, extraer las coordenadas correctamente
          if (shape.type === 'MultiLineString' && shape.coordinates.length > 0) {
            // MultiLineString: coordinates = [ [line1], [line2], ... ]
            // Concatenar todas las líneas en una sola
            const allCoords: [number, number][] = [];
            shape.coordinates.forEach((line: [number, number][]) => {
              allCoords.push(...line);
            });
            shape = {
              type: 'LineString',
              coordinates: allCoords
            };
          }
          
          return {
            ...r,
            shape: shape
          };
        });
        

      },
      error: (err: any) => {}
    });
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
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // La API devuelve geojson en formato [lng, lat]
        const geojsonCoordinates = data.routes[0].geometry.coordinates;

        // Convertir a L.LatLng para Leaflet
        this.coordenadasEnrutadas = geojsonCoordinates.map((c: any) => L.latLng(c[1], c[0]));

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
      console.error('Error al calcular ruta: ', e);
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
      perfil_id: this.api.perfilId,
      nombre_ruta: this.nombreRuta,
      color_hex: '#10b981',
      shape
    };

    this.api.crearRuta(payload).subscribe({
      next: () => {
        this.notificationService.success("Ruta creada exitosamente ✓");
        
        // Guardar la ruta recién creada en memoria para mostrarla sin esperar GET
        const rutaLocal = {
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
      error: (err: any) => {
        this.notificationService.error("Error al guardar la ruta");
      }
    });
  }

  // ===================================================
  // Ver ruta
  // ===================================================

  mostrarRuta(r: any): void {
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
  }
}
