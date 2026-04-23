import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Inyectar token de autenticación si existe
    const token = sessionStorage.getItem('token');
    let authReq = request;

    if (token) {
      authReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Crear error silenciado sin exponer detalles en consola
        const silentError = new HttpErrorResponse({
          error: error.error,       // Preservar body para manejo en componentes
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url || undefined,
        });

        return throwError(() => silentError);
      })
    );
  }
}
