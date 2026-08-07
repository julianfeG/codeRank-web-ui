import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { LoginResponse } from '../../shared/models';

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _isAuthenticated = signal(!!sessionStorage.getItem(TOKEN_KEY));
  /** Whether a token is currently stored. Not validated for expiry client-side — an expired token still reads as authenticated until the backend rejects a request with 401. */
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  login(username: string, password: string): Observable<void> {
    return this.http.post<LoginResponse>('/auth/login', { username, password }).pipe(
      tap(({ token }) => {
        sessionStorage.setItem(TOKEN_KEY, token);
        this._isAuthenticated.set(true);
      }),
      map(() => void 0),
    );
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    this._isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }
}
