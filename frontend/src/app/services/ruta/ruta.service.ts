import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Ruta, RutaProcesada, RutasResponse, CrearRutaPayload, RutaShape } from '../../models';

// =========================================================
// Servicio de dominio: Rutas
// Solo maneja /rutas — no lógica de UI
// =========================================================

@Injectable({
  providedIn: 'root'
})
export class RutaService {

  private readonly baseUrl = `${environment.API_BASE_URL}/rutas`;
  private readonly perfilId = environment.PERFIL_ID;

  constructor(private http: HttpClient) {}

  /** Getter público para el perfil ID (necesario por el componente mapa) */
  getPerfilId(): string {
    return this.perfilId;
  }

  /** Obtiene las rutas del perfil actual (raw) */
  getRutas(): Observable<RutasResponse> {
    const params = new HttpParams().set('perfil_id', this.perfilId);
    return this.http.get<RutasResponse>(this.baseUrl, { params });
  }

  /** Obtiene las rutas ya procesadas (shape parseado y normalizado a LineString) */
  getRutasProcesadas(): Observable<RutaProcesada[]> {
    return this.getRutas().pipe(
      map(resp => {
        const lista = Array.isArray(resp?.data) ? resp.data : (resp as unknown as Ruta[]);
        return lista.map(r => this.procesarRuta(r));
      })
    );
  }

  /** Crea una ruta nueva */
  crearRuta(payload: CrearRutaPayload): Observable<Ruta> {
    const body = {
      perfil_id: payload.perfil_id,
      nombre_ruta: payload.nombre_ruta,
      color_hex: payload.color_hex,
      shape: JSON.stringify(payload.shape)
    };
    return this.http.post<Ruta>(this.baseUrl, body);
  }

  /** Elimina una ruta por ID */
  eliminarRuta(id: string): Observable<void> {
    const params = new HttpParams().set('perfil_id', this.perfilId);
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
  }

  // =========================================================
  // Helpers internos
  // =========================================================

  /**
   * Procesa una ruta del backend:
   * - Parsea shape si viene como string
   * - Convierte MultiLineString → LineString
   */
  private procesarRuta(r: Ruta): RutaProcesada {
    let shape: RutaShape = typeof r.shape === 'string' ? JSON.parse(r.shape) : r.shape;

    // El backend puede transformar LineString a MultiLineString
    const shapeAny = shape as { type: string; coordinates: [number, number][][] | [number, number][] };
    if (shapeAny.type === 'MultiLineString' && Array.isArray(shapeAny.coordinates) && shapeAny.coordinates.length > 0) {
      const allCoords: [number, number][] = [];
      (shapeAny.coordinates as [number, number][][]).forEach((line: [number, number][]) => {
        allCoords.push(...line);
      });
      shape = { type: 'LineString', coordinates: allCoords };
    }

    return {
      id: r.id,
      nombre_ruta: r.nombre_ruta,
      color_hex: r.color_hex,
      shape,
      perfil_id: r.perfil_id,
    };
  }
}
