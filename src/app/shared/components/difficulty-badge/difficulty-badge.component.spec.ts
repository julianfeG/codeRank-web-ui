import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Difficulty } from '../../models';
import { DifficultyBadge } from './difficulty-badge.component';

describe('DifficultyBadge', () => {
  let fixture: ComponentFixture<DifficultyBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DifficultyBadge] }).compileComponents();
    fixture = TestBed.createComponent(DifficultyBadge);
  });

  it.each<Difficulty>(['EASY', 'MEDIUM', 'HARD'])('renders the %s label and a matching CSS class', async (difficulty) => {
    fixture.componentRef.setInput('difficulty', difficulty);
    await fixture.whenStable();

    const chip = fixture.nativeElement.querySelector('mat-chip');
    expect(chip.textContent.trim()).toBe(difficulty);
    expect(chip.classList.contains(`difficulty-${difficulty.toLowerCase()}`)).toBe(true);
  });
});
