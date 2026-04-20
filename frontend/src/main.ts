import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Suprimir todos los mensajes de consola peligrosos
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;
const originalInfo = console.info;

console.log = function(...args: any[]) {
  const message = args[0]?.toString() || '';
  // Bloquear: Angular is running in development mode
  if (message.includes('development mode') || message.includes('Angular')) {
    return;
  }
  originalLog.apply(console, args);
};

console.warn = function(...args: any[]) {
  const message = args[0]?.toString() || '';
  if (message.includes('development') || message.includes('Angular')) {
    return;
  }
  originalWarn.apply(console, args);
};

console.error = function(...args: any[]) {
  const message = args[0]?.toString() || '';
  // Bloquear: POST http://... 401/404/500 y cualquier error HTTP
  if (message.includes('POST http') || message.includes('GET http') || message.includes('PUT http') || message.includes('DELETE http')) {
    return;
  }
  if (message.includes('Unauthorized') || message.includes('401') || message.includes('404') || message.includes('500')) {
    return;
  }
  originalError.apply(console, args);
};

console.info = function(...args: any[]) {
  const message = args[0]?.toString() || '';
  if (message.includes('development') || message.includes('Angular')) {
    return;
  }
  originalInfo.apply(console, args);
};

// Interceptar también eventos de red para suprimir logs de errores HTTP
if (window.addEventListener) {
  window.addEventListener('error', (event) => {
    const message = event.message?.toString() || '';
    if (message.includes('401') || message.includes('Unauthorized') || message.includes('HTTP')) {
      event.preventDefault();
    }
  }, true);
}

bootstrapApplication(App, appConfig)
  .catch(() => {
    // Suprimir silenciosamente
  });
