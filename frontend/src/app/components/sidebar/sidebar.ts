import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../models';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent implements OnInit {

  @Input() isOpen = true;
  @Input() activeSection = 'inicio';
  @Input() menuItems: MenuItem[] = [];

  @Output() sectionChange = new EventEmitter<string>();
  @Output() logoutClick = new EventEmitter<void>();

  usuario: Usuario | null = null;
  rolUsuario: string = '';

  constructor(private router: Router, private auth: AuthService) { }

  ngOnInit(): void {
    this.usuario = this.auth.obtenerUsuario();

    if (this.usuario) {
      switch (this.usuario.id_rol) {
        case 1:
          this.rolUsuario = 'Administrador';
          break;
        case 2:
          this.rolUsuario = 'Conductor';
          break;
        case 3:
          this.rolUsuario = 'Usuario';
          break;
        default:
          this.rolUsuario = 'Invitado';
          break;
      }
    }
  }

  setActiveSection(section: string): void {
    this.sectionChange.emit(section);
  }

  logout(): void {
    this.logoutClick.emit();
  }

  navigateTo(item: MenuItem): void {
    this.setActiveSection(item.id);

    switch (item.id) {

      case 'vehiculos':
        this.router.navigate(['/main', 'vehiculos']);
        break;

      case 'registro-conductores':
        this.router.navigate(['/main', 'registro-conductores']);
        break;

      case 'rutas':
        this.router.navigate(['/main', 'mapa']);
        break;

      case 'asignaciones':
        this.router.navigate(['/main', 'asignaciones']);
        break;

      case 'main':
      case 'inicio':
        this.router.navigate(['/main']);
        break;

      default:
        this.router.navigate(['/main']);
        break;
    }
  }
}
