import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div class="notification"
           *ngFor="let notif of notifications"
           [ngClass]="'notification-' + notif.type"
           [@slideIn]>
        <div class="notification-content">
          <span class="notification-icon">
            <span *ngIf="notif.type === 'success'">✓</span>
            <span *ngIf="notif.type === 'error'">✕</span>
            <span *ngIf="notif.type === 'info'">ⓘ</span>
            <span *ngIf="notif.type === 'warning'">⚠</span>
          </span>
          <span class="notification-message">{{ notif.message }}</span>
        </div>
        <button class="notification-close"
                (click)="close(notif.id)">
          ×
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    }

    .notification {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      animation: slideInRight 0.3s ease-out;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .notification-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .notification-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-weight: 700;
      flex-shrink: 0;
    }

    .notification-message {
      color: white;
      line-height: 1.4;
      word-break: break-word;
    }

    .notification-close {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      margin-left: 12px;
      line-height: 1;
      transition: color 0.2s;

      &:hover {
        color: white;
      }
    }

    .notification-success {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9));
      
      .notification-icon {
        background: rgba(255, 255, 255, 0.2);
        color: #10b981;
      }
    }

    .notification-error {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));
      
      .notification-icon {
        background: rgba(255, 255, 255, 0.2);
        color: #ef4444;
      }
    }

    .notification-info {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9));
      
      .notification-icon {
        background: rgba(255, 255, 255, 0.2);
        color: #3b82f6;
      }
    }

    .notification-warning {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9));
      
      .notification-icon {
        background: rgba(255, 255, 255, 0.2);
        color: #f59e0b;
      }
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(400px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `]
})
export class NotificationContainerComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications.subscribe(
      notifs => this.notifications = notifs
    );
  }

  close(id: string): void {
    this.notificationService.remove(id);
  }
}
