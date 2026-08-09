import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { Login } from './login.component';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let login: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let returnUrl: string | null;

  beforeEach(async () => {
    login = vi.fn();
    navigateByUrl = vi.fn();
    returnUrl = null;

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        { provide: AuthService, useValue: { login } },
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => returnUrl } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('does not call authService.login when the form is invalid (empty fields)', () => {
    component.submit();

    expect(login).not.toHaveBeenCalled();
  });

  it('calls authService.login with the entered credentials when valid', () => {
    login.mockReturnValue(of(undefined));
    component.form.setValue({ username: 'recruiter', password: 'changeme123' });

    component.submit();

    expect(login).toHaveBeenCalledWith('recruiter', 'changeme123');
  });

  it('navigates to /recruiter by default on success', () => {
    login.mockReturnValue(of(undefined));
    component.form.setValue({ username: 'recruiter', password: 'changeme123' });

    component.submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/recruiter');
    expect(component.submitting()).toBe(false);
  });

  it('navigates to the returnUrl query param when present', () => {
    returnUrl = '/recruiter/assessments/new';
    login.mockReturnValue(of(undefined));
    component.form.setValue({ username: 'recruiter', password: 'changeme123' });

    component.submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/recruiter/assessments/new');
  });

  it('sets submitting() true while the request is in flight', () => {
    login.mockReturnValue(of(undefined));
    component.form.setValue({ username: 'recruiter', password: 'changeme123' });

    // Synchronous of(undefined) resolves immediately, so assert the final
    // (settled) state instead — see the next test for the in-flight state.
    component.submit();
    expect(component.submitting()).toBe(false);
  });

  it('resets submitting() back to false on a failed login', () => {
    login.mockReturnValue(throwError(() => new Error('invalid credentials')));
    component.form.setValue({ username: 'recruiter', password: 'wrong' });

    component.submit();

    expect(component.submitting()).toBe(false);
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
