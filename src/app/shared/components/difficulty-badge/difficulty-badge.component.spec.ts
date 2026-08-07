import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DifficultyBadge } from './difficulty-badge.component';

describe('DifficultyBadge', () => {
  let component: DifficultyBadge;
  let fixture: ComponentFixture<DifficultyBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DifficultyBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(DifficultyBadge);
    fixture.componentRef.setInput('difficulty', 'EASY');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
