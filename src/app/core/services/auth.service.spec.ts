import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

const TOKEN_KEY = 'auth_token';

describe('AuthService', () => {
  let httpMock: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    navigate = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate } },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('starts unauthenticated when sessionStorage has no token', () => {
    const service = TestBed.inject(AuthService);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('starts authenticated when sessionStorage already has a token', () => {
    sessionStorage.setItem(TOKEN_KEY, 'pre-existing-token');

    const service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.getToken()).toBe('pre-existing-token');
  });

  it('login() stores the returned token and flips isAuthenticated to true', () => {
    const service = TestBed.inject(AuthService);
    let completed = false;

    service.login('recruiter', 'changeme123').subscribe(() => (completed = true));

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'recruiter', password: 'changeme123' });
    req.flush({ token: 'fresh-token' });

    expect(completed).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('fresh-token');
  });

  it('logout() clears the token, flips isAuthenticated to false, and navigates to /login', () => {
    sessionStorage.setItem(TOKEN_KEY, 'pre-existing-token');
    const service = TestBed.inject(AuthService);

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('getToken() returns null when nothing is stored', () => {
    const service = TestBed.inject(AuthService);
    expect(service.getToken()).toBeNull();
  });
});
