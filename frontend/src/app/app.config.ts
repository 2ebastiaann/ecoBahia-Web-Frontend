import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http'; // <--- obligatorio
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { SilentHttpInterceptor } from './services/http.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(), // <--- registra HttpClient globalmente
    { provide: HTTP_INTERCEPTORS, useClass: SilentHttpInterceptor, multi: true },
    provideAnimationsAsync() // <--- provee animaciones
  ]
};
 