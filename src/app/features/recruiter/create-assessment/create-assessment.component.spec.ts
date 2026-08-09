import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssessmentService } from '../../../core/services/assessment.service';
import { QuestionService } from '../../../core/services/question.service';
import { Question } from '../../../shared/models';
import { CreateAssessment } from './create-assessment.component';

const questions: Question[] = [
  {
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
  },
];

describe('CreateAssessment', () => {
  let component: CreateAssessment;
  let fixture: ComponentFixture<CreateAssessment>;
  let getQuestions: ReturnType<typeof vi.fn>;
  let createAssessment: ReturnType<typeof vi.fn>;
  let dialogOpen: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getQuestions = vi.fn().mockReturnValue(of(questions));
    createAssessment = vi.fn();
    dialogOpen = vi.fn();
    navigate = vi.fn();

    (window as unknown as { matchMedia: unknown }).matchMedia = vi.fn().mockReturnValue({ matches: false });

    await TestBed.configureTestingModule({
      imports: [CreateAssessment],
      providers: [
        { provide: QuestionService, useValue: { getQuestions } },
        { provide: AssessmentService, useValue: { createAssessment } },
        { provide: MatDialog, useValue: { open: dialogOpen } },
        { provide: Router, useValue: { navigate } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAssessment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });

  it('loads the question bank with no filters on init', () => {
    expect(getQuestions).toHaveBeenCalledWith({ category: undefined, difficulty: undefined });
    expect(component.questions()).toEqual(questions);
  });

  it('onCategoryFilterChange reloads with the chosen category', () => {
    getQuestions.mockClear();

    component.onCategoryFilterChange('SQL');

    expect(component.categoryFilter()).toBe('SQL');
    expect(getQuestions).toHaveBeenCalledWith({ category: 'SQL', difficulty: undefined });
  });

  it('onDifficultyFilterChange reloads with the chosen difficulty', () => {
    getQuestions.mockClear();

    component.onDifficultyFilterChange('HARD');

    expect(component.difficultyFilter()).toBe('HARD');
    expect(getQuestions).toHaveBeenCalledWith({ category: undefined, difficulty: 'HARD' });
  });

  it('clearing a filter back to "" drops it from the query again', () => {
    component.onCategoryFilterChange('SQL');
    getQuestions.mockClear();

    component.onCategoryFilterChange('');

    expect(getQuestions).toHaveBeenCalledWith({ category: undefined, difficulty: undefined });
  });

  it('toggleSelection adds and removes question ids', () => {
    component.toggleSelection('q1', true);
    expect(component.selectedIds().has('q1')).toBe(true);

    component.toggleSelection('q1', false);
    expect(component.selectedIds().has('q1')).toBe(false);
  });

  it('canSubmit is false when the form is invalid, even with a selection', () => {
    component.toggleSelection('q1', true);
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit is false when the form is valid but nothing is selected', () => {
    component.form.setValue({ title: 'Kata', description: 'Descripción' });
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit is true once the form is valid and at least one question is selected', () => {
    component.form.setValue({ title: 'Kata', description: 'Descripción' });
    component.toggleSelection('q1', true);
    expect(component.canSubmit()).toBe(true);
  });

  it('openNewQuestionDialog opens QuestionForm with the shared dialog panel class', () => {
    dialogOpen.mockReturnValue({ afterClosed: () => of(undefined) });

    component.openNewQuestionDialog();

    expect(dialogOpen).toHaveBeenCalledTimes(1);
    const [, config] = dialogOpen.mock.calls[0];
    expect(config.panelClass).toBe('question-dialog-panel');
  });

  it('reloads the question bank when a question was actually created', () => {
    dialogOpen.mockReturnValue({ afterClosed: () => of(questions[0]) });
    getQuestions.mockClear();

    component.openNewQuestionDialog();

    expect(getQuestions).toHaveBeenCalled();
  });

  it('does not reload when the dialog is dismissed without creating a question', () => {
    dialogOpen.mockReturnValue({ afterClosed: () => of(undefined) });
    getQuestions.mockClear();

    component.openNewQuestionDialog();

    expect(getQuestions).not.toHaveBeenCalled();
  });

  it('submit() does nothing while canSubmit is false', () => {
    component.submit();
    expect(createAssessment).not.toHaveBeenCalled();
  });

  it('submit() creates the assessment with the selected questions and navigates home', () => {
    createAssessment.mockReturnValue(of({}));
    component.form.setValue({ title: 'Kata', description: 'Descripción' });
    component.toggleSelection('q1', true);

    component.submit();

    expect(createAssessment).toHaveBeenCalledWith({
      title: 'Kata',
      description: 'Descripción',
      questionIds: ['q1'],
    });
    expect(navigate).toHaveBeenCalledWith(['/recruiter']);
    expect(component.saving()).toBe(false);
  });

  it('submit() resets saving() on failure without navigating', () => {
    createAssessment.mockReturnValue(throwError(() => new Error('boom')));
    component.form.setValue({ title: 'Kata', description: 'Descripción' });
    component.toggleSelection('q1', true);

    component.submit();

    expect(component.saving()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
