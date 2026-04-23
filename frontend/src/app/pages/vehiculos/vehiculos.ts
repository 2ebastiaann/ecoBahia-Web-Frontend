import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { VehiculoService } from '../../services/vehiculo/vehiculo.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationContainerComponent } from '../../components/notification-container/notification-container.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { Vehiculo, Usuario } from '../../models';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  templateUrl: './vehiculos.html',
  styleUrls: ['./vehiculos.scss'],
  imports: [CommonModule, ReactiveFormsModule, NotificationContainerComponent, ConfirmDialogComponent]
})
export class VehiculosComponent implements OnInit, OnDestroy {

  vehicles: Vehiculo[] = [];
  vehicleForm: FormGroup;
  showModal = false;
  isEditMode = false;
  selectedVehicle?: Vehiculo;

  showDeleteConfirm = false;
  vehicleToDelete?: Vehiculo;

  usuario: Usuario | null = null;
  esAdmin = false;
  esConductor = false;
  esUsuario = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private vehiculoService: VehiculoService,
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private notificationService: NotificationService
  ) {
    this.vehicleForm = this.fb.group({
      placa: ['', Validators.required],
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      activo: [true, Validators.required]
    });
  }

  ngOnInit(): void {
    this.usuario = this.auth.obtenerUsuario();

    if (this.usuario) {
      this.esAdmin = this.usuario.id_rol === 1;
      this.esConductor = this.usuario.id_rol === 2;
      this.esUsuario = this.usuario.id_rol === 3;
    }

    this.loadVehicles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVehicles(): void {
    this.vehiculoService.getVehiculosList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vehicles: Vehiculo[]) => {
          this.vehicles = vehicles;
        },
        error: () => {}
      });
  }

  openAddModal(): void {
    if (!this.esAdmin && !this.esConductor) return;

    this.isEditMode = false;
    this.vehicleForm.reset({ activo: true });
    this.selectedVehicle = undefined;
    this.showModal = true;
  }

  editVehicle(vehicle: Vehiculo): void {
    if (!this.esAdmin && !this.esConductor) return;

    this.isEditMode = true;
    this.selectedVehicle = vehicle;
    this.vehicleForm.patchValue(vehicle);
    this.showModal = true;
  }

  deleteVehicle(id: string): void {
    if (!this.esAdmin && !this.esConductor) return;

    const vehicle = this.vehicles.find(v => v.id === id);
    if (!vehicle) return;

    this.vehicleToDelete = vehicle;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (!this.vehicleToDelete?.id) return;

    this.vehiculoService.eliminarVehiculo(this.vehicleToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Vehículo eliminado');
          this.showDeleteConfirm = false;
          this.vehicleToDelete = undefined;
          this.loadVehicles();
        },
        error: () => {
          this.notificationService.error('Error al eliminar vehículo');
          this.showDeleteConfirm = false;
        }
      });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.vehicleToDelete = undefined;
  }

  closeModal(): void {
    this.showModal = false;
    this.vehicleForm.reset({ activo: true });
  }

  onSubmit(): void {
    if (this.vehicleForm.invalid) return;

    const data = this.vehicleForm.value;

    // EDITAR VEHÍCULO
    if (this.isEditMode && this.selectedVehicle?.id) {
      this.vehiculoService.actualizarVehiculo(this.selectedVehicle.id, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.success('Vehículo actualizado');
            this.closeModal();
            this.loadVehicles();
          },
          error: () => {
            this.notificationService.error('Error al actualizar vehículo');
          }
        });
      return;
    }

    // CREAR VEHÍCULO
    if (!this.esAdmin && !this.esConductor) return;

    this.vehiculoService.crearVehiculo(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Vehículo creado exitosamente');
          this.closeModal();
          this.loadVehicles();
        },
        error: () => {
          this.notificationService.error('Error al crear vehículo');
        }
      });
  }

  goToMain(): void {
    this.router.navigate(['/main']);
  }
}
