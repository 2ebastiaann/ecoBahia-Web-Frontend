import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { VehiculoService } from '../../services/vehiculo/vehiculo.service';
import { UsuarioService } from '../../services/usuario/usuario.service';
import { RutaService } from '../../services/ruta/ruta.service';
import { RecorridoService } from '../../services/recorrido/recorrido.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationContainerComponent } from '../../components/notification-container/notification-container.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { Vehiculo, Conductor, RutaProcesada, Recorrido, CrearRecorridoPayload, Usuario } from '../../models';
import { LiveTrackingService } from '../../services/live-tracking.service';

@Component({
  selector: 'app-asignaciones',
  standalone: true,
  templateUrl: './asignaciones.html',
  styleUrls: ['./asignaciones.scss'],
  imports: [CommonModule, ReactiveFormsModule, NotificationContainerComponent, ConfirmDialogComponent]
})
export class AsignacionesComponent implements OnInit, OnDestroy {

  // Data
  vehiculos: Vehiculo[] = [];
  conductores: Conductor[] = [];
  rutas: RutaProcesada[] = [];
  recorridos: Recorrido[] = [];

  // Modal & form
  showModal = false;
  formRecorrido: FormGroup;

  usuario: Usuario | null = null;
  esAdmin = false;

  // Confirm dialog
  showConfirmDialog = false;
  private recorridoToDeactivate: Recorrido | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private vehiculoService: VehiculoService,
    private usuarioService: UsuarioService,
    private rutaService: RutaService,
    private recorridoService: RecorridoService,
    private fb: FormBuilder,
    private auth: AuthService,
    private notificationService: NotificationService,
    private liveTrackingService: LiveTrackingService
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData(): void {
    this.vehiculoService.getVehiculosList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vehicles: Vehiculo[]) => this.vehiculos = vehicles,
        error: () => this.vehiculos = []
      });

    this.usuarioService.getConductores()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conductores: Conductor[]) => this.conductores = conductores || [],
        error: () => this.conductores = []
      });

    this.rutaService.getRutasProcesadas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rutas: RutaProcesada[]) => this.rutas = rutas,
        error: () => this.rutas = []
      });

    this.loadRecorridos();
  }

  loadRecorridos(): void {
    this.recorridoService.getRecorridos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recorridos: Recorrido[]) => this.recorridos = recorridos || [],
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

    const payload: CrearRecorridoPayload = this.formRecorrido.value;
    this.recorridoService.crearRecorrido(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Recorrido planificado con éxito');
          this.closeModal();
          this.loadRecorridos();
        },
        error: (err) => {
          this.notificationService.error(err.error?.mensaje || 'Error al crear recorrido');
        }
      });
  }

  // ====================== DESACTIVAR ======================

  desactivarRecorrido(recorrido: Recorrido): void {
    if (!this.esAdmin || !recorrido.activo) return;
    this.recorridoToDeactivate = recorrido;
    this.showConfirmDialog = true;
  }

  confirmDeactivate(): void {
    this.showConfirmDialog = false;
    if (!this.recorridoToDeactivate) return;

    this.recorridoService.desactivarRecorrido(this.recorridoToDeactivate.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Recorrido finalizado correctamente');
          this.loadRecorridos();
        },
        error: (err) => {
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
    const c = this.conductores.find(x => x.id_usuario === id);
    return c ? `${c.nombre} ${c.apellido}` : 'Desconocido';
  }

  getVehiculoPlaca(recorrido: Recorrido): string {
    // First try the enriched fields from backend
    if (recorrido.vehiculo_placa) {
      const marca = recorrido.vehiculo_marca ? ` (${recorrido.vehiculo_marca})` : '';
      return `${recorrido.vehiculo_placa}${marca}`;
    }
    // Fallback: client-side lookup
    const id = recorrido.vehiculo_id;
    if (!id) return 'Sin vehículo';
    const idStr = String(id);
    const v = this.vehiculos.find(x =>
      String(x.id) === idStr
    );
    return v ? `${v.placa} (${v.marca})` : idStr.substring(0, 8) + '...';
  }

  getRutaName(id: string): string {
    const r = this.rutas.find(x => x.id === id);
    return r ? r.nombre_ruta : 'Desconocida';
  }

  isRecorridoEnCurso(recorridoId: string | number | undefined): boolean {
    if (!recorridoId) return false;
    const activeMap = (this.liveTrackingService as any).activeTrucksSubj?.value;
    if (!activeMap) return false;
    
    // Convertir IterableIterator a Array para buscar
    const dataArray = Array.from(activeMap.values()) as any[];
    return dataArray.some(data => String(data.recorrido_id) === String(recorridoId));
  }
}
