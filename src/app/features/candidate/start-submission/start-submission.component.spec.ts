import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssessmentService } from '../../../core/services/assessment.service';
import { SubmissionService } from '../../../core/services/submission.service';
import { AssessmentDetail, Submission } from '../../../shared/models';
import { StartSubmission } from './start-submission.component';

const assessment: AssessmentDetail = {
  id: 'a1',
  title: 'Kata Fullstack',
  description: 'desc',
  createdAt: '2026-08-01T00:00:00.000Z',
  assessmentQuestions: [
    { questionId: 'q1', order: 0, question: {} as never },
    { questionId: 'q2', order: 1, question: {} as never },
  ],
};

describe('StartSubmission', () => {
  let component: StartSubmission;
  let fixture: ComponentFixture<StartSubmission>;
  let getAssessment: ReturnType<typeof vi.fn>;
  let createSubmission: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getAssessment = vi.fn().mockReturnValue(of(assessment));
    createSubmission = vi.fn();
    navigate = vi.fn();

    await TestBed.configureTestingModule({
      imports: [StartSubmission],
      providers: [
        provideHttpClient(),
        { provide: AssessmentService, useValue: { getAssessment } },
        { provide: SubmissionService, useValue: { createSubmission } },
        { provide: Router, useValue: { navigate } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StartSubmission);
    fixture.componentRef.setInput('assessmentId', 'a1');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('loads the assessment for the given assessmentId', () => {
    expect(getAssessment).toHaveBeenCalledWith('a1');
    expect(component.assessment()).toEqual(assessment);
    expect(component.loading()).toBe(false);
  });

  it('computes questionCount and estimatedMinutes from the loaded assessment', () => {
    expect(component.questionCount()).toBe(2);
    expect(component.estimatedMinutes()).toBe(18); // 2 questions * 9 min
  });

  it('questionCount is 0 before/without an assessment', () => {
    getAssessment.mockReturnValue(of({ ...assessment, assessmentQuestions: [] }));
    const otherFixture = TestBed.createComponent(StartSubmission);
    otherFixture.componentRef.setInput('assessmentId', 'a2');
    expect(otherFixture.componentInstance.questionCount()).toBe(0);
  });

  it('canSubmit is false while the form is empty', () => {
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit is false with an invalid email', () => {
    component.form.setValue({ candidateName: 'Ana', candidateEmail: 'not-an-email' });
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit is true once name and a valid email are filled', () => {
    component.form.setValue({ candidateName: 'Ana', candidateEmail: 'ana@test.com' });
    expect(component.canSubmit()).toBe(true);
  });

  it('submit() does nothing while canSubmit is false', () => {
    component.submit();
    expect(createSubmission).not.toHaveBeenCalled();
  });

  it('submit() creates the submission and navigates to resolve-assessment', () => {
    const submission: Submission = {
      id: 's1',
      assessmentId: 'a1',
      candidateName: 'Ana',
      candidateEmail: 'ana@test.com',
      startedAt: '2026-08-09T00:00:00.000Z',
      submittedAt: null,
      status: 'IN_PROGRESS',
    };
    createSubmission.mockReturnValue(of(submission));
    component.form.setValue({ candidateName: 'Ana', candidateEmail: 'ana@test.com' });

    component.submit();

    expect(createSubmission).toHaveBeenCalledWith({
      assessmentId: 'a1',
      candidateName: 'Ana',
      candidateEmail: 'ana@test.com',
    });
    expect(navigate).toHaveBeenCalledWith(['/candidate/submissions', 's1', 'resolve']);
    expect(component.saving()).toBe(false);
  });

  it('submit() resets saving() on failure without navigating', () => {
    createSubmission.mockReturnValue(throwError(() => new Error('boom')));
    component.form.setValue({ candidateName: 'Ana', candidateEmail: 'ana@test.com' });

    component.submit();

    expect(component.saving()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
