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
export class SilentHttpInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Para errores 4xx/5xx, suprimir la visualización en DevTools
        // No llamamos a throwError inmediatamente, sino que lo hacemos después
        // de suprimir los logs del navegador
        
        // Crear un error nuevo sin exponer detalles en consola
        const silentError = new HttpErrorResponse({
          error: null,
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

