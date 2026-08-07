import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../../shared/models';
import { AuthService } from '../services/auth.service';

const HANDLED_STATUSES = [400, 401, 404, 409];

/**
 * Normalizes the backend's `{ error, details }` error body into an
 * ApiError, shows it in a MatSnackBar, and re-throws the ApiError so
 * callers can still react to it (e.g. to highlight a form field).
 *
 * 401s additionally log the user out and redirect to /login — this also
 * covers a failed login attempt itself (harmless no-op there: there's no
 * token to clear and we're already on /login).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((response: HttpErrorResponse) => {
      const backendMessage = response.error?.error;
      const apiError: ApiError = {
        status: response.status,
        message:
          HANDLED_STATUSES.includes(response.status) && backendMessage
            ? backendMessage
            : 'Ocurrió un error inesperado. Intenta nuevamente.',
        details: response.error?.details,
      };

      snackBar.open(apiError.message, 'Cerrar', { duration: 5000 });

      if (response.status === 401) {
        authService.logout();
      }

      return throwError(() => apiError);
    }),
  );
};
