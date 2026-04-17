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
  
  asignacionesConductores: any[] = [];
  asignacionesRutas: any[] = [];

  // Modals & forms for Conductores-Vehiculos
  showModalConductor = false;
  formConductor: FormGroup;

  // Modals & forms for Rutas-Vehiculos
  showModalRuta = false;
  formRuta: FormGroup;

  // Delete Confirmations
  showDeleteConfirm = false;
  deleteType: 'conductor' | 'ruta' | null = null;
  idToDelete: string | null = null;

  usuario: any;
  esAdmin = false;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private auth: AuthService,
    private notificationService: NotificationService
  ) {
    this.formConductor = this.fb.group({
      usuario_id: ['', Validators.required],
      vehiculo_id: ['', Validators.required]
    });

    this.formRuta = this.fb.group({
      vehiculo_id: ['', Validators.required],
      ruta_id: ['', Validators.required]
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
      next: (res: any) => this.vehiculos = res.data || res || []
    });

    this.api.getConductores().subscribe({
      next: (res: any) => this.conductores = res || []
    });

    // Rutas request can fail if api of teacher is down, so handled carefully
    this.api.getRutas().subscribe({
      next: (res: any) => this.rutas = res.data || res || [],
      error: () => this.rutas = [] 
    });

    this.loadAsignaciones();
  }

  loadAsignaciones(): void {
    this.api.getAsignacionesConductores().subscribe({
      next: (res: any) => this.asignacionesConductores = res || [],
      error: () => this.asignacionesConductores = []
    });

    this.api.getAsignacionesRutas().subscribe({
      next: (res: any) => this.asignacionesRutas = res || [],
      error: () => this.asignacionesRutas = []
    });
  }

  // ====================== CONDUCTORES - VEHICULOS ======================

  openConductorModal(): void {
    if (!this.esAdmin) return;
    this.formConductor.reset();
    this.showModalConductor = true;
  }

  closeConductorModal(): void {
    this.showModalConductor = false;
  }

  submitConductor(): void {
    if (this.formConductor.invalid) return;

    this.api.asignarConductor(this.formConductor.value).subscribe({
      next: () => {
        this.notificationService.success('Vehículo asignado a conductor');
        this.closeConductorModal();
        this.loadAsignaciones();
      },
      error: err => {
        this.notificationService.error(err.error?.error || 'Error al asignar');
      }
    });
  }

  // ====================== RUTAS - VEHICULOS ======================

  openRutaModal(): void {
    if (!this.esAdmin) return;
    this.formRuta.reset();
    this.showModalRuta = true;
  }

  closeRutaModal(): void {
    this.showModalRuta = false;
  }

  submitRuta(): void {
    if (this.formRuta.invalid) return;

    this.api.asignarRuta(this.formRuta.value).subscribe({
      next: () => {
        this.notificationService.success('Vehículo asignado a ruta');
        this.closeRutaModal();
        this.loadAsignaciones();
      },
      error: err => {
        this.notificationService.error(err.error?.error || 'Error al asignar');
      }
    });
  }

  // ====================== DELETE HANDLING ======================

  deleteConductorAsignacion(id: string): void {
    if (!this.esAdmin) return;
    this.deleteType = 'conductor';
    this.idToDelete = id;
    this.showDeleteConfirm = true;
  }

  deleteRutaAsignacion(id: string): void {
    if (!this.esAdmin) return;
    this.deleteType = 'ruta';
    this.idToDelete = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (!this.idToDelete || !this.deleteType) return;

    if (this.deleteType === 'conductor') {
      this.api.desasignarConductor(this.idToDelete).subscribe({
        next: () => {
          this.notificationService.success('Asignación eliminada');
          this.loadAsignaciones();
        },
        error: () => this.notificationService.error('Error al eliminar asignación')
      });
    } else if (this.deleteType === 'ruta') {
      this.api.desasignarRuta(this.idToDelete).subscribe({
        next: () => {
          this.notificationService.success('Asignación eliminada');
          this.loadAsignaciones();
        },
        error: () => this.notificationService.error('Error al eliminar asignación')
      });
    }

    this.cancelDelete();
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteType = null;
    this.idToDelete = null;
  }

  // Helpers
  getConductorName(id: string): string {
    const c = this.conductores.find(x => x.id_usuario === id);
    return c ? `${c.nombre} ${c.apellido}` : 'Desconocido';
  }

  getVehiculoPlaca(id: string): string {
    const v = this.vehiculos.find(x => x.id === id);
    return v ? `${v.placa} (${v.marca})` : id; // fallback a id si falla
  }

  getRutaName(id: string): string {
    const r = this.rutas.find(x => x.id === id);
    return r ? r.nombre_ruta : 'Desconocida';
  }
}
