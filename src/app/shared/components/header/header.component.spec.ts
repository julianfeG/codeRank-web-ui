import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../core/services/auth.service';
import { Header } from './header.component';

/** Wildcard route target — content is irrelevant, this just gives the real
 *  Router something to resolve so navigateByUrl() actually completes and
 *  fires NavigationEnd (the RouterLink directives in Header's own template
 *  need a real Router + ActivatedRoute in the injector to work at all). */
@Component({ selector: 'app-blank-test', template: '' })
class BlankTestComponent {}

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let router: Router;
  let logout: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    logout = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([{ path: '**', component: BlankTestComponent }]),
        { provide: AuthService, useValue: { logout } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('isRecruiter is false on a candidate route', async () => {
    await router.navigateByUrl('/candidate/start/a1');
    fixture.detectChanges();
    expect(component.isRecruiter()).toBe(false);
  });

  it('isRecruiter is false on the login route', async () => {
    await router.navigateByUrl('/login');
    fixture.detectChanges();
    expect(component.isRecruiter()).toBe(false);
  });

  it('isRecruiter is true on the recruiter root', async () => {
    await router.navigateByUrl('/recruiter');
    fixture.detectChanges();
    expect(component.isRecruiter()).toBe(true);
  });

  it('isRecruiter is true on a nested recruiter route', async () => {
    await router.navigateByUrl('/recruiter/assessments/new');
    fixture.detectChanges();
    expect(component.isRecruiter()).toBe(true);
  });

  it('isRecruiter is false for a similarly-named but different route', async () => {
    await router.navigateByUrl('/recruiter-extra');
    fixture.detectChanges();
    expect(component.isRecruiter()).toBe(false);
  });

  it('ignores query params when deciding isRecruiter', async () => {
    await router.navigateByUrl('/recruiter?tab=1');
    fixture.detectChanges();
    expect(component.isRecruiter()).toBe(true);
  });

  it('updates isRecruiter live as navigation happens', async () => {
    await router.navigateByUrl('/login');
    fixture.detectChanges();
    expect(component.isRecruiter()).toBe(false);

    await router.navigateByUrl('/recruiter');
    fixture.detectChanges();
    expect(component.isRecruiter()).toBe(true);
  });

  it('the "Cerrar sesión" button calls authService.logout()', async () => {
    await router.navigateByUrl('/recruiter');
    fixture.detectChanges();

    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find((el) =>
      (el as HTMLElement).textContent?.includes('Cerrar sesión'),
    ) as HTMLElement | undefined;

    expect(button).toBeTruthy();
    button!.click();

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('does not show nav links, role tag, or logout button on a non-recruiter route', async () => {
    await router.navigateByUrl('/login');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.nav-links')).toBeNull();
    expect(fixture.nativeElement.querySelector('.role-tag')).toBeNull();
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('button')).some((el) =>
        (el as HTMLElement).textContent?.includes('Cerrar sesión'),
      ),
    ).toBe(false);
  });
});
