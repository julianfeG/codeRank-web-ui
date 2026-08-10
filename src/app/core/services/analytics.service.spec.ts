import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from './analytics.service';

const TEST_MEASUREMENT_ID = 'G-TESTID123';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  // environment.gaMeasurementId is '' under `ng test` (it runs against
  // environment.development.ts), so the positive-path tests below set it
  // explicitly rather than depending on whichever value happens to be
  // committed in environment.ts.
  const originalMeasurementId = environment.gaMeasurementId;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalyticsService);
  });

  afterEach(() => {
    environment.gaMeasurementId = originalMeasurementId;
    delete window.gtag;
    delete window.dataLayer;
    document
      .querySelectorAll('script[src^="https://www.googletagmanager.com/gtag/js"]')
      .forEach((el) => el.remove());
  });

  it('init() injects the gtag.js script tag for the configured measurement ID', () => {
    environment.gaMeasurementId = TEST_MEASUREMENT_ID;

    service.init();

    const script = document.querySelector<HTMLScriptElement>(
      'script[src^="https://www.googletagmanager.com/gtag/js"]',
    );
    expect(script).not.toBeNull();
    expect(script!.src).toBe(`https://www.googletagmanager.com/gtag/js?id=${TEST_MEASUREMENT_ID}`);
    expect(script!.async).toBe(true);
  });

  it('init() wires up window.gtag/dataLayer and sends the initial js/config commands', () => {
    environment.gaMeasurementId = TEST_MEASUREMENT_ID;

    service.init();

    expect(window.dataLayer).toBeTruthy();
    expect(typeof window.gtag).toBe('function');
    // gtag() is `(...args) => dataLayer.push(args)`, so the init sequence shows
    // up as two queued dataLayer entries: ['js', Date] and ['config', id, {...}].
    expect(window.dataLayer![0]).toEqual(['js', expect.any(Date)]);
    expect(window.dataLayer![1]).toEqual(['config', TEST_MEASUREMENT_ID, { send_page_view: false }]);
  });

  it('init() is idempotent — calling it twice only injects one script tag', () => {
    environment.gaMeasurementId = TEST_MEASUREMENT_ID;

    service.init();
    service.init();

    const scripts = document.querySelectorAll(
      'script[src^="https://www.googletagmanager.com/gtag/js"]',
    );
    expect(scripts.length).toBe(1);
  });

  it('init() does nothing when gaMeasurementId is empty (e.g. local development)', () => {
    environment.gaMeasurementId = '';

    service.init();

    expect(
      document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]'),
    ).toBeNull();
    expect(window.gtag).toBeUndefined();
  });

  it('trackEvent() forwards the event name and params to window.gtag after init()', () => {
    environment.gaMeasurementId = TEST_MEASUREMENT_ID;
    service.init();

    service.trackEvent('assessment_started', { assessment_id: 'a1', question_count: 5 });

    const lastCall = window.dataLayer![window.dataLayer!.length - 1];
    expect(lastCall).toEqual(['event', 'assessment_started', { assessment_id: 'a1', question_count: 5 }]);
  });

  it('trackEvent() no-ops without throwing when init() was never called', () => {
    environment.gaMeasurementId = TEST_MEASUREMENT_ID;

    expect(() => service.trackEvent('assessment_started')).not.toThrow();
    expect(window.gtag).toBeUndefined();
  });

  it('trackEvent() no-ops when gaMeasurementId is empty, even after a prior init()', () => {
    environment.gaMeasurementId = TEST_MEASUREMENT_ID;
    service.init();
    environment.gaMeasurementId = '';

    expect(() => service.trackEvent('assessment_started')).not.toThrow();
  });
});
