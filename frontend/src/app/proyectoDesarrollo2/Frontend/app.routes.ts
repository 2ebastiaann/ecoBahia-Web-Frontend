import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/registro-conductores/registro-conductores';
import { MainComponent } from './pages/main/main';
import { VehiculosComponent } from './pages/vehiculos/vehiculos';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { MapaComponent } from './pages/mapa/mapa';
import { AsignacionesComponent } from './pages/asignaciones/asignaciones';

// 🔥 IMPORTAR GUARD
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Ruta raíz → siempre al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Rutas públicas (solo login)
  { path: 'login', component: Login },

  // 🔥 Rutas protegidas con AuthGuard
  {
    path: 'main',
    component: MainComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
      { path: 'vehiculos', component: VehiculosComponent, canActivate: [AuthGuard] },
      { path: 'registro-conductores', component: Register, canActivate: [AuthGuard] },
      { path: 'asignaciones', component: AsignacionesComponent, canActivate: [AuthGuard] },
      { path: 'mapa', component: MapaComponent, canActivate: [AuthGuard] }
    ]
  },

  // Ruta comodín → redirige a login
  { path: '**', redirectTo: 'login' }
];
