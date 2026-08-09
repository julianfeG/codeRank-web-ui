import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssessmentService } from '../../../core/services/assessment.service';
import { SubmissionService } from '../../../core/services/submission.service';
import { AssessmentDetail, EmbeddedQuestion, Submission, SubmissionResult } from '../../../shared/models';
import { ResolveAssessment } from './resolve-assessment.component';

const mcQuestion: EmbeddedQuestion = {
  category: 'Algorithms',
  difficulty: 'EASY',
  type: 'MULTIPLE_CHOICE',
  statement: '¿Cuál es la salida?',
  allowedLanguages: [],
  starterCodeTemplates: null,
  options: [
    { id: 'o1', text: 'A', isCorrect: true },
    { id: 'o2', text: 'B', isCorrect: false },
  ],
};

const codeQuestion: EmbeddedQuestion = {
  category: 'Algorithms',
  difficulty: 'EASY',
  type: 'CODE',
  statement: 'Escribe una función',
  allowedLanguages: ['javascript'],
  starterCodeTemplates: { javascript: 'function solve() {}' },
  options: [],
};

const assessment: AssessmentDetail = {
  id: 'a1',
  title: 'Kata',
  description: '',
  createdAt: '2026-08-01T00:00:00.000Z',
  assessmentQuestions: [
    { questionId: 'q2', order: 1, question: codeQuestion },
    { questionId: 'q1', order: 0, question: mcQuestion },
  ],
};

const submission: Submission = {
  id: 's1',
  assessmentId: 'a1',
  candidateName: 'Ana',
  candidateEmail: 'ana@test.com',
  startedAt: '2026-08-09T00:00:00.000Z',
  submittedAt: null,
  status: 'IN_PROGRESS',
};

function makeResult(overrides: Partial<SubmissionResult> = {}): SubmissionResult {
  return {
    submission,
    answers: [],
    totalScore: 0,
    maxScore: 2,
    ...overrides,
  };
}

describe('ResolveAssessment', () => {
  let component: ResolveAssessment;
  let fixture: ComponentFixture<ResolveAssessment>;
  let getSubmission: ReturnType<typeof vi.fn>;
  let getAssessment: ReturnType<typeof vi.fn>;
  let saveAnswer: ReturnType<typeof vi.fn>;
  let submit: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  async function createFixture(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ResolveAssessment],
      providers: [
        provideHttpClient(),
        provideMonacoEditor(),
        { provide: AssessmentService, useValue: { getAssessment } },
        { provide: SubmissionService, useValue: { getSubmission, saveAnswer, submit } },
        { provide: Router, useValue: { navigate, url: '/candidate/submissions/s1/resolve' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResolveAssessment);
    fixture.componentRef.setInput('submissionId', 's1');
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  beforeEach(() => {
    getSubmission = vi.fn().mockReturnValue(of(makeResult()));
    getAssessment = vi.fn().mockReturnValue(of(assessment));
    saveAnswer = vi.fn().mockReturnValue(of({}));
    submit = vi.fn().mockReturnValue(of(submission));
    navigate = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects straight to results when the submission is already SUBMITTED', async () => {
    getSubmission.mockReturnValue(of(makeResult({ submission: { ...submission, status: 'SUBMITTED' } })));

    await createFixture();

    expect(navigate).toHaveBeenCalledWith(['/candidate/submissions', 's1', 'results']);
    expect(getAssessment).not.toHaveBeenCalled();
  });

  it('sorts orderedQuestions by their assessment order, not API return order', async () => {
    await createFixture();

    expect(component.orderedQuestions().map((q) => q.questionId)).toEqual(['q1', 'q2']);
  });

  it('lands on question index 0 when nothing has been answered yet', async () => {
    await createFixture();

    expect(component.currentIndex()).toBe(0);
    expect(component.currentQuestion()?.questionId).toBe('q1');
  });

  it('lands on the first unanswered question when some are already answered', async () => {
    getSubmission.mockReturnValue(
      of(
        makeResult({
          answers: [
            {
              id: 'ans1',
              questionId: 'q1',
              selectedOptionId: 'o1',
              submittedCode: null,
              language: null,
              testResults: null,
              passed: true,
              score: 1,
            },
          ],
        }),
      ),
    );

    await createFixture();

    expect(component.currentIndex()).toBe(1);
    expect(component.currentQuestion()?.questionId).toBe('q2');
  });

  it('rehydrates mcAnswers and savedCodeAnswers from the fetched answers', async () => {
    getSubmission.mockReturnValue(
      of(
        makeResult({
          answers: [
            {
              id: 'ans1',
              questionId: 'q1',
              selectedOptionId: 'o1',
              submittedCode: null,
              language: null,
              testResults: null,
              passed: true,
              score: 1,
            },
            {
              id: 'ans2',
              questionId: 'q2',
              selectedOptionId: null,
              submittedCode: 'function solve() { return 1; }',
              language: 'javascript',
              testResults: null,
              passed: null,
              score: 0,
            },
          ],
        }),
      ),
    );

    await createFixture();

    expect(component.mcAnswers()).toEqual({ q1: 'o1' });
    expect(component.savedCodeAnswers()['q2'].submittedCode).toBe('function solve() { return 1; }');
  });

  it('isLastQuestion is true only on the final question', async () => {
    await createFixture();

    expect(component.isLastQuestion()).toBe(false);
    component.currentIndex.set(1);
    expect(component.isLastQuestion()).toBe(true);
  });

  it('selectMcOption updates mcAnswers and saves the answer', async () => {
    await createFixture();

    component.selectMcOption('q1', 'o2');

    expect(component.mcAnswers()['q1']).toBe('o2');
    expect(saveAnswer).toHaveBeenCalledWith('s1', { questionId: 'q1', selectedOptionId: 'o2' });
  });

  it('goToNextOrFinish moves to the next question when not on the last one', async () => {
    await createFixture();

    component.goToNextOrFinish();

    expect(component.currentIndex()).toBe(1);
    expect(submit).not.toHaveBeenCalled();
  });

  it('goToNextOrFinish persists the current MC selection before moving on', async () => {
    await createFixture();
    component.selectMcOption('q1', 'o1');
    saveAnswer.mockClear();

    component.goToNextOrFinish();

    expect(saveAnswer).toHaveBeenCalledWith('s1', { questionId: 'q1', selectedOptionId: 'o1' });
  });

  it('goToPrevious moves back a question and clamps at 0', async () => {
    await createFixture();
    component.currentIndex.set(1);

    component.goToPrevious();
    expect(component.currentIndex()).toBe(0);

    component.goToPrevious();
    expect(component.currentIndex()).toBe(0);
  });

  it('goToNextOrFinish triggers submitAssessment on the last question', async () => {
    await createFixture();
    component.currentIndex.set(1);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.goToNextOrFinish();

    expect(submit).toHaveBeenCalledWith('s1');
    expect(navigate).toHaveBeenCalledWith(['/candidate/submissions', 's1', 'results']);
  });

  it('submitAssessment does nothing when the confirmation is declined', async () => {
    await createFixture();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.submitAssessment();

    expect(submit).not.toHaveBeenCalled();
  });

  it('submitAssessment resets submitting() on failure', async () => {
    await createFixture();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    submit.mockReturnValue(throwError(() => new Error('boom')));

    component.submitAssessment();

    expect(component.submitting()).toBe(false);
  });
});
