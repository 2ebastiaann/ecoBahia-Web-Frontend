import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface TrackingData {
  conductor_id: string;
  recorrido_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private serverUrl = environment.API_BASE_URL.replace('/api', ''); // Ej: http://localhost:3007
  private locationUpdateSubj = new Subject<TrackingData>();
  readonly locationUpdate$ = this.locationUpdateSubj.asObservable();

  private conductorDisconnectedSubj = new Subject<string>();
  readonly conductorDisconnected$ = this.conductorDisconnectedSubj.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.authService.obtenerToken();
    if (!token) return;

    this.socket = io(this.serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => console.log('🟢 Web Admin conectado a Socket.IO'));
    
    // Escuchar actualizaciones de ubicación enviadas por los conductores
    this.socket.on('location:update', (data: TrackingData) => {
      console.log('📡 [Web WebSocket] Posición recibida del conductor:', data);
      this.locationUpdateSubj.next(data);
    });

    // Escuchar cuando un conductor finaliza recorrido (se desconecta)
    this.socket.on('conductor:disconnected', (data: { conductor_id: string }) => {
      this.conductorDisconnectedSubj.next(data.conductor_id);
    });

    this.socket.on('connect_error', (err) => console.error('❌ Error Socket.IO:', err.message));
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
