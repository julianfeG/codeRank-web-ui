import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileBlocked } from './mobile-blocked.component';

describe('MobileBlocked', () => {
  let component: MobileBlocked;
  let fixture: ComponentFixture<MobileBlocked>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileBlocked],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileBlocked);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
