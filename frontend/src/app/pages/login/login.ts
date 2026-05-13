import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationContainerComponent } from '../../components/notification-container/notification-container.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationContainerComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  isHovered: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  handleSubmit(): void {
    if (!this.email || !this.password) {
      this.notificationService.warning('Por favor completa todos los campos');
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: res => {
        if (res.ok) {
          // Solo administradores (rol 1) pueden acceder al panel web
          if (res.usuario.id_rol !== 1) {
            this.notificationService.error('Acceso denegado. Solo administradores pueden ingresar.');
            return;
          }

          // rememberMe: si está marcado persiste en localStorage, si no en sessionStorage
          this.authService.guardarToken(res.token, this.rememberMe);
          this.authService.guardarUsuario(res.usuario);
          this.router.navigate(['/main']);
        } else {
          this.notificationService.error('Credenciales inválidas');
        }
      },
      error: () => {
        this.notificationService.error('Error al iniciar sesión. Verifica tus credenciales.');
      }
    });
  }

  handleGoogleLogin(): void {
    this.notificationService.info('Google Sign-In en desarrollo');
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.handleSubmit();
  }

  onMouseEnter(): void { this.isHovered = true; }
  onMouseLeave(): void { this.isHovered = false; }
}
