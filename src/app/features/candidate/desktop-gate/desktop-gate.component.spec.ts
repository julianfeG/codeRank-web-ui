import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DesktopGate } from './desktop-gate.component';

describe('DesktopGate', () => {
  let component: DesktopGate;
  let fixture: ComponentFixture<DesktopGate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesktopGate],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DesktopGate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
