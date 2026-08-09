import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let isAuthenticated: ReturnType<typeof vi.fn>;
  let createUrlTree: ReturnType<typeof vi.fn>;
  const fakeUrlTree = {} as UrlTree;

  beforeEach(() => {
    isAuthenticated = vi.fn();
    createUrlTree = vi.fn().mockReturnValue(fakeUrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated } },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });
  });

  function runGuard(url: string) {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url } as never),
    );
  }

  it('allows navigation when authenticated', () => {
    isAuthenticated.mockReturnValue(true);

    const result = runGuard('/recruiter');

    expect(result).toBe(true);
    expect(createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to /login with returnUrl when not authenticated', () => {
    isAuthenticated.mockReturnValue(false);

    const result = runGuard('/recruiter/assessments/new');

    expect(result).toBe(fakeUrlTree);
    expect(createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/recruiter/assessments/new' },
    });
  });
});
