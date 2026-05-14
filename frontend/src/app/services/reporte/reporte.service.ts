import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reporte } from '../../models';

// =========================================================
// Servicio de dominio: Reportes
// GET /api/reportes — requiere token (admin)
// =========================================================

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  private readonly baseUrl = `${environment.API_BASE_URL}/reportes`;

  constructor(private http: HttpClient) { }

  /** Obtiene todos los reportes (protegido por token) */
  getReportes(): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(this.baseUrl);
  }
}
