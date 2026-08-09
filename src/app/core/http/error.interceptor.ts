import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../../shared/models';
import { AuthService } from '../services/auth.service';

const HANDLED_STATUSES = [400, 401, 404, 409];

/**
 * Shows the backend's Problem Details error (see ApiError) in a
 * MatSnackBar, and re-throws the *complete* HttpErrorResponse so callers
 * can still react to it — e.g. `err.error.codeError` to branch on a
 * specific case, or `err.error.fieldErrors` to highlight a form field.
 *
 * The snackbar copy itself is unchanged from before the Problem Details
 * migration: `title` is the new shape's equivalent of the old body's
 * `error` field (a short backend-provided summary), read the same way —
 * only shown for HANDLED_STATUSES, falling back to a generic message
 * otherwise. `detail` is deliberately never used here: it's backend
 * debugging info, not user-facing copy. When the backend sends a
 * `codeError`, it's prefixed onto the copy as `(codeError) mensaje` so
 * it's visible for support/debugging without needing devtools.
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
      const apiError: ApiError | undefined = response.error;
      const backendMessage = apiError?.title;
      const message =
        HANDLED_STATUSES.includes(response.status) && backendMessage
          ? backendMessage
          : 'Ocurrió un error inesperado. Intenta nuevamente.';
      const snackbarText = apiError?.codeError ? `(${apiError.codeError}) ${message}` : message;

      snackBar.open(snackbarText, 'Cerrar', { duration: 5000 });

      if (response.status === 401) {
        authService.logout();
      }

      return throwError(() => response);
    }),
  );
};
