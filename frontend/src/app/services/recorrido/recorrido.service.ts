import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Recorrido, CrearRecorridoPayload } from '../../models';

// =========================================================
// Servicio de dominio: Recorridos (Planificación local)
// Solo maneja /recorridos_locales — no lógica de UI
// =========================================================

@Injectable({
  providedIn: 'root'
})
export class RecorridoService {

  private readonly baseUrl = `${environment.API_BASE_URL}/recorridos_locales`;

  constructor(private http: HttpClient) {}

  /** Obtiene todos los recorridos */
  getRecorridos(): Observable<Recorrido[]> {
    return this.http.get<Recorrido[]>(this.baseUrl);
  }

  /** Crea un nuevo recorrido */
  crearRecorrido(body: CrearRecorridoPayload): Observable<Recorrido> {
    return this.http.post<Recorrido>(this.baseUrl, body);
  }

  /** Desactiva (finaliza) un recorrido activo */
  desactivarRecorrido(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/desactivar`, {});
  }
}
