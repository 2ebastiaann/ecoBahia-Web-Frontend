import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Recorrido, CrearRecorridoPayload } from '../../models';

// =========================================================
// Servicio de dominio: Recorridos
// Maneja /recorridos — sin lógica de UI
// =========================================================

@Injectable({
  providedIn: 'root'
})
export class RecorridoService {

  private readonly baseUrl = `${environment.API_BASE_URL}/recorridos`;

  constructor(private http: HttpClient) {}

  /** Obtiene todos los recorridos */
  getRecorridos(): Observable<Recorrido[]> {
    return this.http.get<Recorrido[]>(this.baseUrl);
  }

  /** Crea un nuevo recorrido */
  crearRecorrido(body: CrearRecorridoPayload): Observable<Recorrido> {
    return this.http.post<Recorrido>(`${this.baseUrl}/iniciar`, body);
  }

  /** Finaliza un recorrido activo */
  finalizarRecorrido(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/finalizar`, {});
  }

  /** Obtiene las posiciones que contienen fotos para un recorrido */
  obtenerFotosRecorrido(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${id}/fotos`);
  }
}
