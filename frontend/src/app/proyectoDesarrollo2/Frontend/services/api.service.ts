import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// ========= TIPOS PARA RUTAS =========
export interface RutaShape {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat]
}

export interface CrearRutaPayload {
  nombre_ruta: string;
  perfil_id: string;
  color_hex: string;          // ✔ NECESARIO
  shape: RutaShape;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = environment.API_BASE_URL;
  private _perfilId = environment.PERFIL_ID;

  // Getter
  get perfilId(): string {
    return this._perfilId;
  }

  constructor(private http: HttpClient) { }

  // ======================================================
  // 🚗 VEHÍCULOS (NO SE BORRA NADA)
  // ======================================================

  getVehiculos(): Observable<any> {
    const params = new HttpParams().set('perfil_id', this._perfilId);
    return this.http.get<any[]>(`${this.baseUrl}/vehiculos`, { params });
  }

  crearVehiculo(vehiculo: any): Observable<any> {
    const body = { ...vehiculo, perfil_id: this._perfilId };
    return this.http.post(`${this.baseUrl}/vehiculos`, body);
  }

  actualizarVehiculo(id: string, vehiculo: any): Observable<any> {
    const body = { ...vehiculo, perfil_id: this._perfilId };
    return this.http.put(`${this.baseUrl}/vehiculos/${id}`, body);
  }

  eliminarVehiculo(id: string): Observable<any> {
    const params = new HttpParams().set('perfil_id', this._perfilId);
    return this.http.delete(`${this.baseUrl}/vehiculos/${id}`, { params });
  }

  // ======================================================
  // 👥 CONDUCTORES (USUARIOS)
  // ======================================================

  getConductores(): Observable<any> {
    return this.http.get<any[]>(`${this.baseUrl}/usuarios/conductores`);
  }

  crearConductor(conductor: any): Observable<any> {
    // Para crear un conductor se llama al endpoint de registro con id_rol = 2
    const body = { ...conductor, id_rol: 2 };
    return this.http.post(`${this.baseUrl}/usuarios/register`, body);
  }

  actualizarConductor(id: string, conductor: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/usuarios/conductores/${id}`, conductor);
  }

  eliminarConductor(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/usuarios/conductores/${id}`);
  }

  // ======================================================
  // 📍 RUTAS
  // ======================================================

  getRutas(): Observable<any> {
    const params = new HttpParams().set('perfil_id', this._perfilId);
    return this.http.get<any>(`${this.baseUrl}/rutas`, { params });
  }

  crearRuta(payload: CrearRutaPayload): Observable<any> {
    const body = {
      perfil_id: payload.perfil_id,
      nombre_ruta: payload.nombre_ruta,
      color_hex: payload.color_hex,
      shape: JSON.stringify(payload.shape)
    };
    return this.http.post<any>(`${this.baseUrl}/rutas`, body);
  }

  eliminarRuta(id: string): Observable<any> {
    const params = new HttpParams().set('perfil_id', this._perfilId);
    return this.http.delete(`${this.baseUrl}/rutas/${id}`, { params });
  }

  // ======================================================
  // 📍 RECORRIDOS (PLANIFICACIÓN LOCAL)
  // ======================================================

  getRecorridos(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/recorridos_locales`);
  }

  crearRecorrido(body: { ruta_id: string, vehiculo_id: string, perfil_id: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/recorridos_locales`, body);
  }

  desactivarRecorrido(id: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/recorridos_locales/${id}/desactivar`, {});
  }
}
