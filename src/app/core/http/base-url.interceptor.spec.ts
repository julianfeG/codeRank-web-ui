import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { baseUrlInterceptor } from './base-url.interceptor';

describe('baseUrlInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([baseUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('prefixes a relative path with environment.apiUrl', () => {
    http.get('/questions').subscribe();

    httpMock.expectOne(`${environment.apiUrl}/questions`);
  });

  it('adds the missing leading slash before prefixing', () => {
    http.get('questions').subscribe();

    httpMock.expectOne(`${environment.apiUrl}/questions`);
  });

  it('leaves an absolute http(s) URL untouched', () => {
    http.get('https://example.com/external').subscribe();

    httpMock.expectOne('https://example.com/external');
  });
});
