import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';

registerLocaleData(localeEs);

import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';
import { baseUrlInterceptor } from './core/http/base-url.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';

// NOTE: @angular/animations is deprecated as of Angular 21 (in favor of the
// native animate.enter/animate.leave template syntax), so no animations
// provider is registered here. Angular Material degrades gracefully without
// one — components just render without enter/exit transitions. Add native
// animations per-component later if/when the visual design needs them.
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es' },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // base-url first (resolves the full URL), auth next (attaches the token to
    // that URL), error last (closest to the backend call, so it catches
    // everything — including 401s from a missing/expired token).
    provideHttpClient(withInterceptors([baseUrlInterceptor, authInterceptor, errorInterceptor])),
    provideMonacoEditor({
      baseUrl: 'assets/monaco/min/vs',
      defaultOptions: { scrollBeyondLastLine: false, automaticLayout: true },
    }),
  ],
};
