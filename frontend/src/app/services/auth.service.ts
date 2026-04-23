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

  guardarToken(token: string): void {
    sessionStorage.setItem('token', token);
  }

  guardarUsuario(usuario: Usuario): void {
    sessionStorage.setItem('usuario', JSON.stringify(usuario));
  }

  obtenerToken(): string | null {
    return sessionStorage.getItem('token');
  }

  obtenerUsuario(): Usuario | null {
    const raw = sessionStorage.getItem('usuario');
    if (!raw) return null;
    return JSON.parse(raw) as Usuario;
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
  }
}
