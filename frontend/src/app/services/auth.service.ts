import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario, LoginResponse, RegisterResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.API_BASE_URL}/usuarios`;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password });
  }

  register(email: string, password: string, id_rol: number): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, { email, password, id_rol });
  }

  /**
   * Guarda el token de sesión.
   * Si rememberMe=true → localStorage (persiste al cerrar el navegador).
   * Si rememberMe=false → sessionStorage (se borra al cerrar la pestaña).
   */
  guardarToken(token: string, rememberMe: boolean = false): void {
    if (rememberMe) {
      localStorage.setItem('token', token);
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', token);
      localStorage.removeItem('token');
    }
  }

  guardarUsuario(usuario: Usuario): void {
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
    storage.setItem('usuario', JSON.stringify(usuario));
  }

  /** Busca el token en sessionStorage primero, luego en localStorage (rememberMe) */
  obtenerToken(): string | null {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  obtenerUsuario(): Usuario | null {
    const raw = sessionStorage.getItem('usuario') || localStorage.getItem('usuario');
    if (!raw) return null;
    return JSON.parse(raw) as Usuario;
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }
}
