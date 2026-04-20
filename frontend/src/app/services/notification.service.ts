import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // ms, 0 = no auto-close
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  public notifications: Observable<Notification[]> = this.notifications$.asObservable();

  constructor() {}

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 4000): void {
    const id = Date.now().toString();
    const notification: Notification = { id, message, type, duration };

    const current = this.notifications$.value;
    this.notifications$.next([...current, notification]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  success(message: string, duration: number = 4000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration: number = 5000): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration: number = 4000): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }

  remove(id: string): void {
    const current = this.notifications$.value;
    this.notifications$.next(current.filter(n => n.id !== id));
  }

  clear(): void {
    this.notifications$.next([]);
  }
}
