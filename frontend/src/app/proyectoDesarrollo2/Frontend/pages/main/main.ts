import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import * as L from 'leaflet';
import { filter } from 'rxjs/operators';

import { SidebarComponent } from '../../components/sidebar/sidebar';
import { HeaderComponent } from '../../components/header/header';

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
  private mapInitTimeout?: any;

  // Manejo de capas
  private layerNormal!: L.TileLayer;
  private layerSatellite!: L.TileLayer;
  public isSatelliteMode = false;

  menuItems = [
    { id: 'inicio', label: 'Home', icon: 'icon-home' },
    { id: 'rutas', label: 'Rutas', icon: 'icon-route' },
    { id: 'asignaciones', label: 'Recorridos', icon: 'icon-settings' },
    { id: 'registro-conductores', label: 'Conductores', icon: 'icon-user' },
    { id: 'vehiculos', label: 'Vehículos', icon: 'icon-car' }
  ];

  constructor(private router: Router) {
    this.currentRoute = this.router.url;

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
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
  }

  ngOnDestroy(): void {
    if (this.mapInitTimeout) {
      clearTimeout(this.mapInitTimeout);
    }
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
    // Evitar múltiples inicializaciones simultáneas
    if (this.mapInitInProgress) {
      return;
    }

    // Si ya está inicializado, no reiniciar
    if (this.mapInitialized && this.previewMap) {
      return;
    }

    this.mapInitInProgress = true;

    try {
      const container = document.getElementById('mainMapPreview') as any;
      if (!container) {
        this.mapInitInProgress = false;
        return;
      }

      // 1. Destruir mapa anterior si existe
      if (this.previewMap) {
        try {
          this.previewMap.off();
          this.previewMap.remove();
        } catch (e) {
          // Ignorar errores
        }
        this.previewMap = undefined;
      }

      // 2. Limpiar referencias de Leaflet en el contenedor
      if (container._leaflet_id !== undefined) {
        container._leaflet_id = null;
      }

      // 3. Crear nuevo mapa
      this.previewMap = L.map(container, {
        center: [3.8773, -77.0277],
        zoom: 13,
        maxZoom: 18
      });

      this.layerNormal = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      });

      this.layerSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19
      });

      this.layerNormal.addTo(this.previewMap);
      this.isSatelliteMode = false;

      this.mapInitialized = true;
    } catch (e) {
      // Ignorar errores en inicialización
      this.mapInitialized = false;
      this.previewMap = undefined;
    } finally {
      this.mapInitInProgress = false;
    }
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

  abrirMapa() {
    this.router.navigate(['/main', 'mapa'], { queryParams: { create: '1' } });
  }

  onLogout() {
    sessionStorage.removeItem('token');
    // también remuevo el usuario por si acaso, tal como en el authService
    sessionStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}
