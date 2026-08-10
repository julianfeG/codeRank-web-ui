import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Thin wrapper around GA4's gtag.js — scoped to the candidate flow only.
 *
 * Nothing loads until init() is called (from DesktopGate, which wraps every
 * candidate route), so recruiter/login screens never pull in the GA script or
 * report traffic. environment.gaMeasurementId is empty in development on
 * purpose, so local runs never pollute production analytics; both init() and
 * trackEvent() are no-ops in that case.
 *
 * gtag() itself is just `(...args) => dataLayer.push(args)` — calls made
 * before the remote script finishes loading are queued in dataLayer and
 * flushed once it's ready, so there's no race to worry about between init()
 * and the first trackEvent().
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private initialized = false;

  /** Injects the gtag.js script tag and wires up window.gtag/dataLayer. Safe to call more than once — only the first call does anything. */
  init(): void {
    const measurementId = environment.gaMeasurementId;
    if (!measurementId || this.initialized) {
      return;
    }
    this.initialized = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args: unknown[]) => window.dataLayer!.push(args);
    window.gtag('js', new Date());
    // send_page_view: false — the candidate flow is a handful of SPA routes
    // tracked explicitly as named events (assessment_start_view, etc.)
    // instead of relying on GA's URL-based pageview heuristic.
    window.gtag('config', measurementId, { send_page_view: false });
  }

  /** No-ops silently if init() was never called or gaMeasurementId is unset (e.g. local development). */
  trackEvent(name: string, params?: Record<string, unknown>): void {
    if (!environment.gaMeasurementId) {
      return;
    }
    window.gtag?.('event', name, params);
  }
}
