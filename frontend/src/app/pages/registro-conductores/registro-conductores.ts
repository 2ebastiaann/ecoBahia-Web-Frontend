import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { UsuarioService } from '../../services/usuario/usuario.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationContainerComponent } from '../../components/notification-container/notification-container.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { Conductor, CrearConductorPayload, ActualizarConductorPayload, Usuario } from '../../models';

@Component({
  selector: 'app-registro-conductores',
  standalone: true,
  templateUrl: './registro-conductores.html',
  styleUrls: ['./registro-conductores.scss'],
  imports: [CommonModule, ReactiveFormsModule, NotificationContainerComponent, ConfirmDialogComponent]
})
export class Register implements OnInit, OnDestroy {

  conductores: Conductor[] = [];
  conductorForm: FormGroup;
  showModal = false;
  isEditMode = false;
  selectedConductor?: Conductor;

  showDeleteConfirm = false;
  conductorToDelete?: Conductor;

  usuario: Usuario | null = null;
  esAdmin = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private usuarioService: UsuarioService,
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private notificationService: NotificationService
  ) {
    this.conductorForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''] // Optional on edit, required on create
    });
  }

  ngOnInit(): void {
    this.usuario = this.auth.obtenerUsuario();

    if (this.usuario) {
      this.esAdmin = this.usuario.id_rol === 1;
    }

    this.loadConductores();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConductores(): void {
    this.usuarioService.getConductores()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conductores: Conductor[]) => {
          this.conductores = conductores || [];
        },
        error: () => {}
      });
  }

  openAddModal(): void {
    if (!this.esAdmin) return;

    this.isEditMode = false;
    this.conductorForm.reset();
    this.conductorForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.conductorForm.get('password')?.updateValueAndValidity();
    
    this.selectedConductor = undefined;
    this.showModal = true;
  }

  editConductor(conductor: Conductor): void {
    if (!this.esAdmin) return;

    this.isEditMode = true;
    this.selectedConductor = conductor;
    this.conductorForm.reset({
      nombre: conductor.nombre,
      apellido: conductor.apellido,
      email: conductor.email,
      password: '' // Don't show password, only send if user types it
    });
    
    this.conductorForm.get('password')?.clearValidators();
    this.conductorForm.get('password')?.updateValueAndValidity();
    
    this.showModal = true;
  }

  deleteConductor(id: string): void {
    if (!this.esAdmin) return;

    const conductor = this.conductores.find(c => c.id_usuario === id);
    if (!conductor) return;

    this.conductorToDelete = conductor;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (!this.conductorToDelete?.id_usuario) return;

    this.usuarioService.eliminarConductor(this.conductorToDelete.id_usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Conductor eliminado');
          this.showDeleteConfirm = false;
          this.conductorToDelete = undefined;
          this.loadConductores();
        },
        error: () => {
          this.notificationService.error('Error al eliminar conductor');
          this.showDeleteConfirm = false;
        }
      });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.conductorToDelete = undefined;
  }

  closeModal(): void {
    this.showModal = false;
    this.conductorForm.reset();
  }

  onSubmit(): void {
    if (this.conductorForm.invalid) {
      if (this.conductorForm.get('email')?.invalid) {
         this.notificationService.warning('Por favor ingrese un correo válido');
      } else if (this.conductorForm.get('password')?.invalid && !this.isEditMode) {
         this.notificationService.warning('La contraseña debe tener al menos 6 caracteres');
      } else {
         this.notificationService.warning('Por favor completa todos los campos obligatorios');
      }
      return;
    }

    const value = this.conductorForm.value;

    // EDITAR CONDUCTOR
    if (this.isEditMode && this.selectedConductor?.id_usuario) {
      const updateData: ActualizarConductorPayload = {
        nombre: value.nombre,
        apellido: value.apellido,
        email: value.email,
      };

      // Only send password if it has value (important for edits)
      if (value.password && value.password.trim() !== '') {
        updateData.password = value.password;
      }

      this.usuarioService.actualizarConductor(this.selectedConductor.id_usuario, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.success('Conductor actualizado');
            this.closeModal();
            this.loadConductores();
          },
          error: (err) => {
            const errorMsg = err.error?.error || 'Error al actualizar conductor';
            this.notificationService.error(errorMsg);
          }
        });
      return;
    }

    // CREAR CONDUCTOR
    if (!this.esAdmin) return;

    const createData: CrearConductorPayload = {
      nombre: value.nombre,
      apellido: value.apellido,
      email: value.email,
    };

    if (value.password && value.password.trim() !== '') {
      createData.password = value.password;
    }

    this.usuarioService.crearConductor(createData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Conductor registrado exitosamente');
          this.closeModal();
          this.loadConductores();
        },
        error: (err) => {
          const errorMsg = err.error?.error || 'Error al registrar conductor';
          this.notificationService.error(errorMsg);
        }
      });
  }
}
