import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestionService } from '../../../core/services/question.service';
import { Question } from '../../../shared/models';
import { QuestionBank } from './question-bank.component';

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
  options: [{ id: 'o1', questionId: 'q1', text: 'A', isCorrect: true }],
};

const codeQuestion: Question = {
  id: 'q2',
  category: 'Algorithms',
  difficulty: 'HARD',
  type: 'CODE',
  statement: 'Escribe una función',
  allowedLanguages: ['javascript', 'python'],
  functionName: 'solve',
  starterCodeTemplates: { javascript: 'function solve() {}' },
  testCases: [{ input: 'a', output: 'b' }],
  options: [],
};

describe('QuestionBank', () => {
  let component: QuestionBank;
  let fixture: ComponentFixture<QuestionBank>;
  let getQuestions: ReturnType<typeof vi.fn>;
  let dialogOpen: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getQuestions = vi.fn().mockReturnValue(of([mcQuestion, codeQuestion]));
    dialogOpen = vi.fn();

    (window as unknown as { matchMedia: unknown }).matchMedia = vi.fn().mockReturnValue({ matches: false });

    await TestBed.configureTestingModule({
      imports: [QuestionBank],
      providers: [
        { provide: QuestionService, useValue: { getQuestions } },
        { provide: MatDialog, useValue: { open: dialogOpen } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionBank);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });

  it('loads all questions with no filters on init', () => {
    expect(getQuestions).toHaveBeenCalledWith({ category: undefined, difficulty: undefined });
    expect(component.questions()).toEqual([mcQuestion, codeQuestion]);
    expect(component.isEmpty()).toBe(false);
  });

  it('isEmpty is true once loaded with no results', async () => {
    getQuestions.mockReturnValue(of([]));
    component.onCategoryFilterChange('SQL');
    await fixture.whenStable();

    expect(component.isEmpty()).toBe(true);
  });

  it('onCategoryFilterChange/onDifficultyFilterChange reload with the chosen filters', () => {
    getQuestions.mockClear();
    component.onCategoryFilterChange('SQL');
    expect(getQuestions).toHaveBeenLastCalledWith({ category: 'SQL', difficulty: undefined });

    getQuestions.mockClear();
    component.onDifficultyFilterChange('HARD');
    expect(getQuestions).toHaveBeenLastCalledWith({ category: 'SQL', difficulty: 'HARD' });
  });

  it('toggleExpand sets and clears expandedId, one row at a time', () => {
    component.toggleExpand(mcQuestion);
    expect(component.expandedId()).toBe('q1');

    component.toggleExpand(codeQuestion);
    expect(component.expandedId()).toBe('q2');

    component.toggleExpand(codeQuestion);
    expect(component.expandedId()).toBeNull();
  });

  it('languageLabel maps known codes and falls back to the raw code otherwise', () => {
    expect(component.languageLabel('javascript')).toBe('JavaScript');
    expect(component.languageLabel('python')).toBe('Python');
    expect(component.languageLabel('java')).toBe('Java');
    expect(component.languageLabel('rust')).toBe('rust');
  });

  it('formatValue renders strings as-is and everything else as JSON', () => {
    expect(component.formatValue('hello')).toBe('hello');
    expect(component.formatValue(42)).toBe('42');
    expect(component.formatValue(true)).toBe('true');
    expect(component.formatValue({ a: 1 })).toBe('{"a":1}');
    expect(component.formatValue([1, 2])).toBe('[1,2]');
  });

  it('openNewQuestionDialog opens QuestionForm with the shared dialog panel class', () => {
    dialogOpen.mockReturnValue({ afterClosed: () => of(undefined) });

    component.openNewQuestionDialog();

    const [, config] = dialogOpen.mock.calls[0];
    expect(config.panelClass).toBe('question-dialog-panel');
  });

  it('reloads the list when a new question is created from the dialog', () => {
    dialogOpen.mockReturnValue({ afterClosed: () => of(mcQuestion) });
    getQuestions.mockClear();

    component.openNewQuestionDialog();

    expect(getQuestions).toHaveBeenCalled();
  });

  it('does not reload when the dialog is dismissed without creating', () => {
    dialogOpen.mockReturnValue({ afterClosed: () => of(undefined) });
    getQuestions.mockClear();

    component.openNewQuestionDialog();

    expect(getQuestions).not.toHaveBeenCalled();
  });
});
