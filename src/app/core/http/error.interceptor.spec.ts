import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let open: ReturnType<typeof vi.fn>;
  let logout: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    open = vi.fn();
    logout = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open } },
        { provide: AuthService, useValue: { logout } },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('shows the backend title for a handled status (400)', () => {
    let caught: unknown;
    http.get('/assessments').subscribe({ error: (err) => (caught = err) });

    httpMock
      .expectOne('/assessments')
      .flush(
        { title: 'El título es obligatorio', status: 400, detail: '', instance: '', codeError: '', timestamp: '' },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(open).toHaveBeenCalledWith('El título es obligatorio', 'Cerrar', { duration: 5000 });
    expect(caught).toBeTruthy();
  });

  it('prefixes the codeError when the backend sends one', () => {
    http.get('/assessments').subscribe({ error: () => {} });

    httpMock.expectOne('/assessments').flush(
      {
        title: 'No encontrado',
        status: 404,
        detail: '',
        instance: '',
        codeError: 'ASSESSMENT_NOT_FOUND',
        timestamp: '',
      },
      { status: 404, statusText: 'Not Found' },
    );

    expect(open).toHaveBeenCalledWith('(ASSESSMENT_NOT_FOUND) No encontrado', 'Cerrar', { duration: 5000 });
  });

  it('falls back to a generic message for an unhandled status', () => {
    http.get('/assessments').subscribe({ error: () => {} });

    httpMock.expectOne('/assessments').flush(
      { title: 'Internal error', status: 500, detail: '', instance: '', codeError: '', timestamp: '' },
      { status: 500, statusText: 'Server Error' },
    );

    expect(open).toHaveBeenCalledWith('Ocurrió un error inesperado. Intenta nuevamente.', 'Cerrar', {
      duration: 5000,
    });
  });

  it('falls back to a generic message when a handled status has no body/title', () => {
    http.get('/assessments').subscribe({ error: () => {} });

    httpMock.expectOne('/assessments').flush(null, { status: 400, statusText: 'Bad Request' });

    expect(open).toHaveBeenCalledWith('Ocurrió un error inesperado. Intenta nuevamente.', 'Cerrar', {
      duration: 5000,
    });
  });

  it('logs out on a 401', () => {
    http.get('/assessments').subscribe({ error: () => {} });

    httpMock.expectOne('/assessments').flush(
      { title: 'No autorizado', status: 401, detail: '', instance: '', codeError: '', timestamp: '' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('does not log out on a non-401 error', () => {
    http.get('/assessments').subscribe({ error: () => {} });

    httpMock.expectOne('/assessments').flush(
      { title: 'No encontrado', status: 404, detail: '', instance: '', codeError: '', timestamp: '' },
      { status: 404, statusText: 'Not Found' },
    );

    expect(logout).not.toHaveBeenCalled();
  });

  it('re-throws the full HttpErrorResponse for callers to react to', () => {
    let caught: { status?: number } | undefined;
    http.get('/assessments').subscribe({ error: (err) => (caught = err) });

    httpMock.expectOne('/assessments').flush(
      { title: 'No encontrado', status: 404, detail: '', instance: '', codeError: '', timestamp: '' },
      { status: 404, statusText: 'Not Found' },
    );

    expect(caught?.status).toBe(404);
  });
});
