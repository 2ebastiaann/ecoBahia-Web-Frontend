import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Conductor, CrearConductorPayload, ActualizarConductorPayload } from '../../models';

// =========================================================
// Servicio de dominio: Usuarios / Conductores
// Solo maneja /usuarios/conductores — no lógica de UI
// =========================================================

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private readonly baseUrl = `${environment.API_BASE_URL}/usuarios`;

  constructor(private http: HttpClient) {}

  /** Obtiene la lista de conductores */
  getConductores(): Observable<Conductor[]> {
    return this.http.get<Conductor[]>(`${this.baseUrl}/conductores`);
  }

  /** Crea un nuevo conductor (registro con id_rol = 2) */
  crearConductor(conductor: CrearConductorPayload): Observable<Conductor> {
    const body: CrearConductorPayload = { ...conductor, id_rol: 2 };
    return this.http.post<Conductor>(`${this.baseUrl}/register`, body);
  }

  /** Actualiza un conductor existente */
  actualizarConductor(id: string, conductor: ActualizarConductorPayload): Observable<Conductor> {
    return this.http.put<Conductor>(`${this.baseUrl}/conductores/${id}`, conductor);
  }

  /** Elimina un conductor por ID */
  eliminarConductor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/conductores/${id}`);
  }
}
