import { Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { MobileBlocked } from '../../../shared/components/mobile-blocked/mobile-blocked.component';

/** The candidate flow needs a real code editor — below this width it's blocked outright. */
const DESKTOP_MIN_WIDTH = 1024;

/**
 * Wraps the whole candidate route tree (start-submission, resolve-assessment, and
 * submission-result when reached from the candidate's own route). Not a route guard on
 * purpose: the constraint is the CURRENT viewport size, which can change without any
 * navigation (the user resizing the window) — a guard only checks once, at activation
 * time. This reacts live via a matchMedia listener instead, swapping app-mobile-blocked
 * in for the router-outlet whenever the viewport narrows below the desktop breakpoint,
 * and back the moment it widens again — no reload, no redirect.
 */
@Component({
  selector: 'app-desktop-gate',
  imports: [RouterOutlet, MobileBlocked],
  templateUrl: './desktop-gate.component.html',
  styleUrl: './desktop-gate.component.scss',
})
export class DesktopGate implements OnDestroy {
  private readonly analytics = inject(AnalyticsService);
  private readonly mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);
  private readonly onChange = (event: MediaQueryListEvent): void => this.isDesktop.set(event.matches);

  readonly isDesktop = signal(this.mediaQuery.matches);

  constructor() {
    this.mediaQuery.addEventListener('change', this.onChange);
    // Entry point for the whole candidate route tree — GA4 loads here and
    // nowhere else, so recruiter/login screens never pull in the script.
    this.analytics.init();
  }

  ngOnDestroy(): void {
    this.mediaQuery.removeEventListener('change', this.onChange);
  }
}
