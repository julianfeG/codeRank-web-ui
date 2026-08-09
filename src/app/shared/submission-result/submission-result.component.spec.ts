import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { AssessmentService } from '../../core/services/assessment.service';
import { SubmissionService } from '../../core/services/submission.service';
import { AssessmentDetail, EmbeddedQuestion, EmbeddedQuestionOption, SubmissionResult } from '../models';
import { SubmissionResultView } from './submission-result.component';

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

const assessment: AssessmentDetail = {
  id: 'a1',
  title: 'Kata',
  description: '',
  createdAt: '2026-08-01T00:00:00.000Z',
  assessmentQuestions: [
    { questionId: 'q2', order: 1, question: mcQuestion },
    { questionId: 'q1', order: 0, question: mcQuestion },
  ],
};

function makeResult(overrides: Partial<SubmissionResult> = {}): SubmissionResult {
  return {
    submission: {
      id: 's1',
      assessmentId: 'a1',
      candidateName: 'Ana',
      candidateEmail: 'ana@test.com',
      startedAt: '2026-08-01T00:00:00.000Z',
      submittedAt: '2026-08-01T01:00:00.000Z',
      status: 'SUBMITTED',
    },
    answers: [
      { id: 'ans1', questionId: 'q1', selectedOptionId: 'o1', submittedCode: null, language: null, testResults: null, passed: true, score: 1 },
      { id: 'ans2', questionId: 'q2', selectedOptionId: 'o2', submittedCode: null, language: null, testResults: null, passed: false, score: 0 },
    ],
    totalScore: 1,
    maxScore: 2,
    ...overrides,
  };
}

describe('SubmissionResultView', () => {
  let component: SubmissionResultView;
  let fixture: ComponentFixture<SubmissionResultView>;
  let getSubmission: ReturnType<typeof vi.fn>;
  let getAssessment: ReturnType<typeof vi.fn>;

  async function createFixture(routerUrl: string): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [SubmissionResultView],
      providers: [
        { provide: SubmissionService, useValue: { getSubmission } },
        { provide: AssessmentService, useValue: { getAssessment } },
        { provide: Router, useValue: { url: routerUrl } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmissionResultView);
    fixture.componentRef.setInput('submissionId', 's1');
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  beforeEach(() => {
    getSubmission = vi.fn().mockReturnValue(of(makeResult()));
    getAssessment = vi.fn().mockReturnValue(of(assessment));
  });

  it('loads the submission then the assessment, and sorts rows by the assessment order', async () => {
    await createFixture('/recruiter/assessments/a1/submissions/s1');

    expect(getSubmission).toHaveBeenCalledWith('s1');
    expect(getAssessment).toHaveBeenCalledWith('a1');
    expect(component.rows().map((r) => r.answer.questionId)).toEqual(['q1', 'q2']);
    expect(component.rows()[0].question).toEqual(mcQuestion);
    expect(component.loading()).toBe(false);
  });

  it('rows() still lists the answers (without question detail) when the assessment fetch fails', async () => {
    getAssessment.mockReturnValue(throwError(() => new Error('boom')));
    await createFixture('/recruiter/assessments/a1/submissions/s1');

    expect(component.rows().length).toBe(2);
    expect(component.rows()[0].question).toBeUndefined();
  });

  it('isCandidateView is true on a /candidate/... route', async () => {
    await createFixture('/candidate/submissions/s1/results');
    expect(component.isCandidateView).toBe(true);
  });

  it('isCandidateView is false on a /recruiter/... route', async () => {
    await createFixture('/recruiter/assessments/a1/submissions/s1');
    expect(component.isCandidateView).toBe(false);
  });

  it('optionIcon shows a check for the correct option regardless of what was selected', async () => {
    await createFixture('/recruiter/assessments/a1/submissions/s1');
    const [correct] = mcQuestion.options;
    expect(component.optionIcon(correct, 'o2')).toBe('check_circle');
  });

  it('optionIcon shows a cancel icon for the wrong option the candidate actually picked', async () => {
    await createFixture('/recruiter/assessments/a1/submissions/s1');
    const wrong: EmbeddedQuestionOption = mcQuestion.options[1];
    expect(component.optionIcon(wrong, 'o2')).toBe('cancel');
  });

  it('optionIcon shows a plain unchecked circle for an unselected wrong option', async () => {
    await createFixture('/recruiter/assessments/a1/submissions/s1');
    const wrong: EmbeddedQuestionOption = mcQuestion.options[1];
    expect(component.optionIcon(wrong, 'o1')).toBe('radio_button_unchecked');
  });

  it('passPercent rounds to a whole number and is 0 when maxScore is 0', async () => {
    await createFixture('/recruiter/assessments/a1/submissions/s1');
    expect(component.passPercent(makeResult({ totalScore: 1, maxScore: 3 }))).toBe(33);
    expect(component.passPercent(makeResult({ totalScore: 0, maxScore: 0 }))).toBe(0);
  });

  it('passed requires both a SUBMITTED status and hitting the passing bar', async () => {
    await createFixture('/recruiter/assessments/a1/submissions/s1');

    const passingSubmitted = makeResult({ totalScore: 10, maxScore: 10 });
    expect(component.passed(passingSubmitted)).toBe(
      100 >= environment.passingScorePercent,
    );

    const passingButInProgress = makeResult({
      totalScore: 10,
      maxScore: 10,
      submission: { ...passingSubmitted.submission, status: 'IN_PROGRESS' },
    });
    expect(component.passed(passingButInProgress)).toBe(false);
  });

  it('lays out 40 confetti pieces once, for the celebration banner', async () => {
    await createFixture('/candidate/submissions/s1/results');
    expect(component.confettiPieces.length).toBe(40);
  });
});
