import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationContainerComponent } from '../../components/notification-container/notification-container.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-asignaciones',
  standalone: true,
  templateUrl: './asignaciones.html',
  styleUrls: ['./asignaciones.scss'],
  imports: [CommonModule, ReactiveFormsModule, NotificationContainerComponent, ConfirmDialogComponent]
})
export class AsignacionesComponent implements OnInit {

  // Data
  vehiculos: any[] = [];
  conductores: any[] = [];
  rutas: any[] = [];
  recorridos: any[] = [];

  // Modal & form
  showModal = false;
  formRecorrido: FormGroup;

  usuario: any;
  esAdmin = false;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private auth: AuthService,
    private notificationService: NotificationService
  ) {
    this.formRecorrido = this.fb.group({
      ruta_id: ['', Validators.required],
      vehiculo_id: ['', Validators.required],
      perfil_id: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.usuario = this.auth.obtenerUsuario();
    if (this.usuario) {
      this.esAdmin = this.usuario.id_rol === 1;
    }

    this.loadAllData();
  }

  loadAllData(): void {
    this.api.getVehiculos().subscribe({
      next: (res: any) => {
        // Backend wraps as { msg, data: { current_page, data: [...vehicles] } }
        // So res.data could be the paginated object with .data inside
        const outer = res.data || res || {};
        const vehicles = outer.data || outer;
        this.vehiculos = Array.isArray(vehicles) ? vehicles : [];
      },
      error: () => this.vehiculos = []
    });

    this.api.getConductores().subscribe({
      next: (res: any) => this.conductores = res || [],
      error: () => this.conductores = []
    });

    this.api.getRutas().subscribe({
      next: (res: any) => this.rutas = res.data || res || [],
      error: () => this.rutas = []
    });

    this.loadRecorridos();
  }

  loadRecorridos(): void {
    this.api.getRecorridos().subscribe({
      next: (res: any) => this.recorridos = res || [],
      error: () => this.recorridos = []
    });
  }

  // ====================== MODAL ======================

  openModal(): void {
    if (!this.esAdmin) return;
    this.showModal = true;
    this.formRecorrido.reset();
  }

  closeModal(): void {
    this.showModal = false;
    this.formRecorrido.reset();
  }

  submitRecorrido(): void {
    if (this.formRecorrido.invalid) return;

    this.api.crearRecorrido(this.formRecorrido.value).subscribe({
      next: () => {
        this.notificationService.success('Recorrido planificado con éxito');
        this.closeModal();
        this.loadRecorridos();
      },
      error: (err: any) => {
        this.notificationService.error(err.error?.mensaje || 'Error al crear recorrido');
      }
    });
  }

  // ====================== DESACTIVAR ======================

  showConfirmDialog = false;
  private recorridoToDeactivate: any = null;

  desactivarRecorrido(recorrido: any): void {
    if (!this.esAdmin || !recorrido.activo) return;
    this.recorridoToDeactivate = recorrido;
    this.showConfirmDialog = true;
  }

  confirmDeactivate(): void {
    this.showConfirmDialog = false;
    if (!this.recorridoToDeactivate) return;

    this.api.desactivarRecorrido(this.recorridoToDeactivate.id).subscribe({
      next: () => {
        this.notificationService.success('Recorrido finalizado correctamente');
        this.loadRecorridos();
      },
      error: (err: any) => {
        this.notificationService.error(err.error?.mensaje || 'Error al finalizar recorrido');
      }
    });
    this.recorridoToDeactivate = null;
  }

  cancelDeactivate(): void {
    this.showConfirmDialog = false;
    this.recorridoToDeactivate = null;
  }

  // ====================== HELPERS ======================

  getConductorName(id: string): string {
    const c = this.conductores.find((x: any) => x.id_usuario === id);
    return c ? `${c.nombre} ${c.apellido}` : 'Desconocido';
  }

  getVehiculoPlaca(recorrido: any): string {
    // First try the enriched fields from backend
    if (recorrido.vehiculo_placa) {
      const marca = recorrido.vehiculo_marca ? ` (${recorrido.vehiculo_marca})` : '';
      return `${recorrido.vehiculo_placa}${marca}`;
    }
    // Fallback: client-side lookup
    const id = recorrido.vehiculo_id;
    if (!id) return 'Sin vehículo';
    const idStr = String(id);
    const v = this.vehiculos.find((x: any) =>
      String(x.id) === idStr || String(x.id_vehiculo) === idStr
    );
    return v ? `${v.placa} (${v.marca})` : idStr.substring(0, 8) + '...';
  }

  getRutaName(id: string): string {
    const r = this.rutas.find((x: any) => x.id === id);
    return r ? r.nombre_ruta : 'Desconocida';
  }
}
