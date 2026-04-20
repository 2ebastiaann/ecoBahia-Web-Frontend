import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent {

  constructor(private router: Router) {}

  // Reemplazamos el modal por navegar al mapa para crear rutas
  openCreateRouteModal() {
    // Navegar al mapa indicando que queremos crear una ruta
    this.router.navigate(['/mapa'], { queryParams: { create: '1' } });
  }

  closeCreateRouteModal() {
    // ya no se usa
  }
}
