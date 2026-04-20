import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class LeafletMapService {

  private map: L.Map | null = null;

  private drawing = false;
  private currentPoints: L.LatLng[] = [];
  private currentPolyline: L.Polyline | null = null;
  private pointMarkers: (L.Marker | L.CircleMarker)[] = [];

  private routesLayers: Record<string, L.Layer> = {};

  constructor() {}

  // ===========================================================
  //   INICIALIZAR MAPA
  // ===========================================================
  initMap(containerId: string) {
    if (this.map) return;

    this.map = L.map(containerId, {
      center: [3.8773, -77.0277],
      zoom: 14
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.map.invalidateSize();
  }

  // ===========================================================
  //   ACTIVAR MODO DIBUJO (CLICK-CLICK COMO TU AMIGO)
  // ===========================================================
  startDrawing(onFinish: (coords: [number, number][]) => void, color: string = '#2563eb') {
    if (!this.map) return;

    this.drawing = true;
    this.currentPoints = [];
    this.clearTempDrawing();

    const clickHandler = (e: L.LeafletMouseEvent) => {
      if (!this.drawing) return;

      const point = e.latlng;
      this.currentPoints.push(point);

      const marker = L.circleMarker(point, {
        radius: 6,
        color: color,
        fillColor: color,
        fillOpacity: 1,
        weight: 2
      }).addTo(this.map!);
      this.pointMarkers.push(marker);

      if (this.currentPolyline) {
        this.currentPolyline.setLatLngs(this.currentPoints);
      } else {
        this.currentPolyline = L.polyline(this.currentPoints, {
          color: color,
          weight: 4
        }).addTo(this.map!);
      }
    };

    this.map.on('click', clickHandler);

    // Guardar la función para finalizar dibujo
    this.finishDrawing = () => {
      this.map!.off('click', clickHandler);
      this.drawing = false;

      const finalCoords = this.currentPoints.map(p => [p.lat, p.lng] as [number, number]);
      onFinish(finalCoords);
    };
  }

  // Será reemplazada en startDrawing
  finishDrawing() {}

  // ===========================================================
  //   LIMPIAR DIBUJO TEMPORAL
  // ===========================================================
  clearTempDrawing() {
    if (this.currentPolyline) {
      try { this.map?.removeLayer(this.currentPolyline); } catch {}
      this.currentPolyline = null;
    }

    this.pointMarkers.forEach(m => {
      try { this.map?.removeLayer(m); } catch {}
    });

    this.pointMarkers = [];
  }

  // ===========================================================
  //    DIBUJAR RUTA CARGADA
  // ===========================================================
  drawRoute(coords: [number, number][], meta: any) {
    if (!this.map) return;

    const latlngs = coords.map(c => L.latLng(c[0], c[1]));

    const poly = L.polyline(latlngs, {
      color: meta.color || '#10b981',
      weight: 4
    }).addTo(this.map);

    this.routesLayers[meta.id] = poly;
  }

  focusOnRoute(id: string) {
    const layer = this.routesLayers[id];
    if (layer) {
      this.map!.fitBounds((layer as any).getBounds(), { padding: [50, 50] });
    }
  }

  showAllRoutes() {
    Object.values(this.routesLayers).forEach(layer => {
      layer.addTo(this.map!);
    });
  }

  clearAll() {
    Object.values(this.routesLayers).forEach(layer => layer.remove());
    this.routesLayers = {};
  }

  invalidateSize() {
    this.map?.invalidateSize();
  }
}
