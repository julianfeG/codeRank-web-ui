import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MobileBlocked } from './mobile-blocked.component';

describe('MobileBlocked', () => {
  let fixture: ComponentFixture<MobileBlocked>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MobileBlocked] }).compileComponents();
    fixture = TestBed.createComponent(MobileBlocked);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the desktop-required message', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Necesitas una computadora');
    expect(text).toContain('Guarda este link');
  });
});
