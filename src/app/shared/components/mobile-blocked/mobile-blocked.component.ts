import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Shown instead of the candidate flow (start/resolve/results) when the viewport is too
 * narrow for a real code editor. Purely presentational — see app-desktop-gate for the
 * live viewport check that decides when this renders.
 */
@Component({
  selector: 'app-mobile-blocked',
  imports: [MatIconModule],
  templateUrl: './mobile-blocked.component.html',
  styleUrl: './mobile-blocked.component.scss',
})
export class MobileBlocked {}
