import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-overlay" *ngIf="isOpen" (click)="onCancel()">
      <div class="confirm-dialog" (click)="$event.stopPropagation()">
        <div class="confirm-header">
          <h3>{{ title }}</h3>
        </div>
        <div class="confirm-body">
          <p>{{ message }}</p>
        </div>
        <div class="confirm-footer">
          <button class="btn-cancel" (click)="onCancel()">
            {{ cancelText }}
          </button>
          <button class="btn-confirm" (click)="onConfirm()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      animation: fadeIn 0.2s ease-out;
      backdrop-filter: blur(4px);
    }

    .confirm-dialog {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
      width: 90%;
      max-width: 420px;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .confirm-header {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95));
      padding: 28px 28px 20px;
      color: white;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
    }

    .confirm-header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      border-radius: 50%;
    }

    .confirm-header h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .confirm-header h3::before {
      content: '⚠️';
      font-size: 24px;
    }

    .confirm-body {
      padding: 28px;
      color: #e5e7eb;
      background: linear-gradient(135deg, rgba(31, 41, 55, 0.5) 0%, rgba(17, 24, 39, 0.5) 100%);
    }

    .confirm-body p {
      margin: 0;
      font-size: 15px;
      line-height: 1.8;
      font-weight: 500;
    }

    .confirm-footer {
      display: flex;
      gap: 12px;
      padding: 20px 28px;
      background: rgba(0, 0, 0, 0.3);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      justify-content: flex-end;
    }

    .btn-cancel,
    .btn-confirm {
      padding: 12px 28px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-cancel {
      background: rgba(75, 85, 99, 0.8);
      color: #f3f4f6;
      border: 1px solid rgba(107, 114, 128, 0.5);
      
      &:hover {
        background: rgba(107, 114, 128, 0.9);
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
      }
    }

    .btn-confirm {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      border: 1px solid rgba(239, 68, 68, 0.5);
      
      &:hover {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        transform: translateY(-3px);
        box-shadow: 0 12px 24px rgba(239, 68, 68, 0.4);
      }

      &:active {
        transform: translateY(-1px);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Confirmar';
  @Input() message: string = '¿Estás seguro?';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
