import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { WebSocketService, TrackingData } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class LiveTrackingService implements OnDestroy {
  // Mapa en memoria: conductor_id -> TrackingData
  private activeTrucksSubj = new BehaviorSubject<Map<string, TrackingData>>(new Map());
  readonly activeTrucks$ = this.activeTrucksSubj.asObservable();

  private subs: Subscription[] = [];

  constructor(private wsService: WebSocketService) {
    this.subs.push(
      this.wsService.locationUpdate$.subscribe((data) => {
        this.updateTruckLocation(data);
      })
    );

    this.subs.push(
      this.wsService.conductorDisconnected$.subscribe((conductorId) => {
        this.removeTruck(conductorId);
      })
    );
  }

  iniciarMonitoreo(): void {
    this.wsService.connect();
    // Aquí a futuro llamaremos a un HTTP GET para traer la última posición de todos antes de que emitan.
  }

  detenerMonitoreo(): void {
    this.wsService.disconnect();
    this.activeTrucksSubj.next(new Map()); // Limpiar mapa
  }

  private updateTruckLocation(data: TrackingData): void {
    const currentMap = this.activeTrucksSubj.value;
    const cid = String(data.conductor_id);
    currentMap.set(cid, data);
    
    // Emitir el nuevo estado clónico para que Angular detecte cambios
    this.activeTrucksSubj.next(new Map(currentMap));
  }

  private removeTruck(conductorId: string | number): void {
    const currentMap = this.activeTrucksSubj.value;
    const cid = String(conductorId);
    if (currentMap.has(cid)) {
      currentMap.delete(cid);
      this.activeTrucksSubj.next(new Map(currentMap));
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
