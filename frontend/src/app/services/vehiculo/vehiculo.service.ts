import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Vehiculo, VehiculosResponse, CrearVehiculoPayload } from '../../models';

// =========================================================
// Servicio de dominio: Vehículos
// Solo maneja /vehiculos — no lógica de UI
// =========================================================

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {

  private readonly baseUrl = `${environment.API_BASE_URL}/vehiculos`;
  private readonly perfilId = environment.PERFIL_ID;

  constructor(private http: HttpClient) {}

  /** Obtiene todos los vehículos del perfil actual */
  getVehiculos(): Observable<VehiculosResponse> {
    const params = new HttpParams().set('perfil_id', this.perfilId);
    return this.http.get<VehiculosResponse>(this.baseUrl, { params });
  }

  /** Extrae el array plano de vehículos de la respuesta paginada */
  getVehiculosList(): Observable<Vehiculo[]> {
    return this.getVehiculos().pipe(
      map(res => {
        const outer = res.data;
        if (Array.isArray(outer)) return outer;
        return Array.isArray(outer?.data) ? outer.data : [];
      })
    );
  }

  /** Crea un vehículo nuevo */
  crearVehiculo(vehiculo: Omit<CrearVehiculoPayload, 'perfil_id'>): Observable<Vehiculo> {
    const body: CrearVehiculoPayload = { ...vehiculo, perfil_id: this.perfilId };
    return this.http.post<Vehiculo>(this.baseUrl, body);
  }

  /** Actualiza un vehículo existente */
  actualizarVehiculo(id: string, vehiculo: Partial<CrearVehiculoPayload>): Observable<Vehiculo> {
    const body = { ...vehiculo, perfil_id: this.perfilId };
    return this.http.put<Vehiculo>(`${this.baseUrl}/${id}`, body);
  }

  /** Elimina un vehículo por ID */
  eliminarVehiculo(id: string): Observable<void> {
    const params = new HttpParams().set('perfil_id', this.perfilId);
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
  }
}
