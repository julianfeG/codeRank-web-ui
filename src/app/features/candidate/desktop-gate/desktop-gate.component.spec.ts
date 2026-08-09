import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DesktopGate } from './desktop-gate.component';

/** jsdom doesn't implement matchMedia — a minimal fake MediaQueryList that
 *  lets tests flip `.matches` and fire the 'change' listener DesktopGate registers. */
class FakeMediaQueryList {
  matches: boolean;
  private listener: ((event: MediaQueryListEvent) => void) | null = null;

  constructor(matches: boolean) {
    this.matches = matches;
  }

  addEventListener(_type: 'change', listener: (event: MediaQueryListEvent) => void): void {
    this.listener = listener;
  }

  removeEventListener(_type: 'change', listener: (event: MediaQueryListEvent) => void): void {
    if (this.listener === listener) {
      this.listener = null;
    }
  }

  /** Test helper: simulate the viewport crossing the breakpoint. */
  emit(matches: boolean): void {
    this.matches = matches;
    this.listener?.({ matches } as MediaQueryListEvent);
  }
}

describe('DesktopGate', () => {
  let component: DesktopGate;
  let fixture: ComponentFixture<DesktopGate>;
  let mediaQueryList: FakeMediaQueryList;

  function setup(initialMatches: boolean): void {
    mediaQueryList = new FakeMediaQueryList(initialMatches);
    // jsdom doesn't implement matchMedia at all (not even as a stub), so
    // there's nothing for vi.spyOn to wrap — assign it directly instead.
    (window as unknown as { matchMedia: unknown }).matchMedia = vi
      .fn()
      .mockReturnValue(mediaQueryList);
  }

  afterEach(() => {
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });

  it('starts as desktop when the viewport already matches the breakpoint', async () => {
    setup(true);
    await TestBed.configureTestingModule({
      imports: [DesktopGate],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(DesktopGate);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(component.isDesktop()).toBe(true);
  });

  it('starts as not-desktop when the viewport is narrower than the breakpoint', async () => {
    setup(false);
    await TestBed.configureTestingModule({
      imports: [DesktopGate],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(DesktopGate);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(component.isDesktop()).toBe(false);
  });

  it('reacts live to the viewport crossing the breakpoint in either direction', async () => {
    setup(true);
    await TestBed.configureTestingModule({
      imports: [DesktopGate],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(DesktopGate);
    component = fixture.componentInstance;
    await fixture.whenStable();

    mediaQueryList.emit(false);
    expect(component.isDesktop()).toBe(false);

    mediaQueryList.emit(true);
    expect(component.isDesktop()).toBe(true);
  });

  it('removes the media query listener on destroy', async () => {
    setup(true);
    await TestBed.configureTestingModule({
      imports: [DesktopGate],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(DesktopGate);
    component = fixture.componentInstance;
    await fixture.whenStable();

    fixture.destroy();
    // After destroy, further changes to the (now unsubscribed) media query must not throw or update anything.
    expect(() => mediaQueryList.emit(false)).not.toThrow();
  });
});
