import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Question } from '../../models';
import { QuestionCard } from './question-card.component';

const mcQuestion: Question = {
  id: 'q1',
  category: 'Algorithms',
  difficulty: 'EASY',
  type: 'MULTIPLE_CHOICE',
  statement: '¿Cuál es la salida?',
  allowedLanguages: [],
  functionName: null,
  starterCodeTemplates: null,
  testCases: null,
  options: [],
};

const codeQuestion: Question = { ...mcQuestion, id: 'q2', type: 'CODE' };

describe('QuestionCard', () => {
  let component: QuestionCard;
  let fixture: ComponentFixture<QuestionCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [QuestionCard] }).compileComponents();
    fixture = TestBed.createComponent(QuestionCard);
    component = fixture.componentInstance;
  });

  it('typeIcon is "checklist" for a MULTIPLE_CHOICE question', () => {
    fixture.componentRef.setInput('question', mcQuestion);
    expect(component.typeIcon()).toBe('checklist');
  });

  it('typeIcon is "code" for a CODE question', () => {
    fixture.componentRef.setInput('question', codeQuestion);
    expect(component.typeIcon()).toBe('code');
  });

  it('selected defaults to false and toggles when set', () => {
    fixture.componentRef.setInput('question', mcQuestion);
    expect(component.selected()).toBe(false);

    component.selected.set(true);
    expect(component.selected()).toBe(true);
  });

  it('renders the checkbox only when selectable is true', async () => {
    fixture.componentRef.setInput('question', mcQuestion);
    fixture.componentRef.setInput('selectable', false);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('mat-checkbox')).toBeNull();

    fixture.componentRef.setInput('selectable', true);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('mat-checkbox')).not.toBeNull();
  });
});
