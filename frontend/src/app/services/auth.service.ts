import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface LoginResponse {
  ok: boolean;
  token: string;
  usuario: {
    id_usuario: string;
    email: string;
    id_rol: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.API_BASE_URL}/usuarios`;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password });
  }

  register(email: string, password: string, id_rol: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { email, password, id_rol });
  }

  guardarToken(token: string) {
    sessionStorage.setItem('token', token);
  }

  guardarUsuario(usuario: any) {
    sessionStorage.setItem('usuario', JSON.stringify(usuario));
  }

  obtenerToken(): string | null {
    return sessionStorage.getItem('token');
  }

  obtenerUsuario() {
    return JSON.parse(sessionStorage.getItem('usuario') || 'null');
  }

  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
  }
}
