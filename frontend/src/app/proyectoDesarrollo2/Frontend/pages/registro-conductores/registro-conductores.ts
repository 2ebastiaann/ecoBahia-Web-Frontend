import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationContainerComponent } from '../../components/notification-container/notification-container.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

interface Conductor {
  id_usuario?: string;
  email: string;
  nombre: string;
  apellido: string;
}

@Component({
  selector: 'app-registro-conductores',
  standalone: true,
  templateUrl: './registro-conductores.html',
  styleUrls: ['./registro-conductores.scss'],
  imports: [CommonModule, ReactiveFormsModule, NotificationContainerComponent, ConfirmDialogComponent]
})
export class Register implements OnInit {

  conductores: Conductor[] = [];
  conductorForm: FormGroup;
  showModal = false;
  isEditMode = false;
  selectedConductor?: Conductor;

  showDeleteConfirm = false;
  conductorToDelete?: Conductor;

  usuario: any;
  esAdmin = false;

  constructor(
    private api: ApiService,
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

  loadConductores(): void {
    this.api.getConductores().subscribe({
      next: (res: any) => {
        this.conductores = res || [];
      },
      error: err => {
        console.error("Error loading conductores", err);
      }
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

    this.api.eliminarConductor(this.conductorToDelete.id_usuario).subscribe({
      next: () => {
        this.notificationService.success('Conductor eliminado');
        this.showDeleteConfirm = false;
        this.conductorToDelete = undefined;
        this.loadConductores();
      },
      error: err => {
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
    const data: any = {
      nombre: value.nombre,
      apellido: value.apellido,
      email: value.email
    };
    
    // Only send password if it has value (important for edits)
    if (value.password && value.password.trim() !== '') {
      data.password = value.password;
    }

    // EDITAR CONDUCTOR
    if (this.isEditMode && this.selectedConductor?.id_usuario) {
      this.api.actualizarConductor(this.selectedConductor.id_usuario, data).subscribe({
        next: () => {
          this.notificationService.success('Conductor actualizado');
          this.closeModal();
          this.loadConductores();
        },
      error: err => {
        console.error("Error editando:", err);
        const errorMsg = err.error?.error || 'Error al actualizar conductor';
        this.notificationService.error(errorMsg);
      }
      });
      return;
    }

    // CREAR CONDUCTOR
    if (!this.esAdmin) return;

    this.api.crearConductor(data).subscribe({
      next: () => {
        this.notificationService.success('Conductor registrado exitosamente');
        this.closeModal();
        this.loadConductores();
      },
      error: err => {
        const errorMsg = err.error?.error || 'Error al registrar conductor';
        this.notificationService.error(errorMsg);
      }
    });
  }
}
