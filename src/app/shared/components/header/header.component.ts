import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Global top bar, rendered once in AppComponent so it's present on every screen
 * (recruiter, candidate, login). Shows the "Recruiter" tag, nav links, and
 * "Cerrar sesión" on the right only while navigated under /recruiter/* —
 * candidate screens have no equivalent tag, links, or session to log out of.
 * "Cerrar sesión" used to live only on AssessmentList's own page header, so
 * it vanished the moment a recruiter navigated anywhere else — moved here so
 * it's always reachable instead.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class Header {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

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
