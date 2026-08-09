import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

/**
 * Global top bar, rendered once in AppComponent so it's present on every screen
 * (recruiter, candidate, login). Shows the "Recruiter" tag on the right only
 * while navigated under /recruiter/* — candidate screens have no equivalent tag.
 */
@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class Header {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Matches /recruiter and /recruiter/..., not a lookalike like /recruiter-x. */
  readonly isRecruiter = computed(() => {
    const url = this.currentUrl().split('?')[0];
    return url === '/recruiter' || url.startsWith('/recruiter/');
  });
}
