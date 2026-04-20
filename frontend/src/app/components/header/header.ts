import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
  imports: [CommonModule]
})
export class HeaderComponent {
  @Input() sidebarOpen = true;
  @Input() title = 'EcoBahía';

  @Output() toggle = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  onToggle(): void {
    this.toggle.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }
}
