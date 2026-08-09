import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssessmentService } from '../../../core/services/assessment.service';
import { environment } from '../../../../environments/environment';
import { SubmissionSummary } from '../../../shared/models';
import { AssessmentSubmissions } from './assessment-submissions.component';

const submissions: SubmissionSummary[] = [
  {
    id: 's1',
    candidateName: 'Ana',
    candidateEmail: 'ana@test.com',
    status: 'SUBMITTED',
    startedAt: '2026-08-01T00:00:00.000Z',
    submittedAt: '2026-08-01T01:00:00.000Z',
    totalScore: 8,
    maxScore: 10,
  },
  {
    id: 's2',
    candidateName: 'Beto',
    candidateEmail: 'beto@test.com',
    status: 'SUBMITTED',
    startedAt: '2026-08-01T00:00:00.000Z',
    submittedAt: '2026-08-01T01:00:00.000Z',
    totalScore: 3,
    maxScore: 10,
  },
  {
    id: 's3',
    candidateName: 'Cami',
    candidateEmail: 'cami@test.com',
    status: 'IN_PROGRESS',
    startedAt: '2026-08-01T00:00:00.000Z',
    submittedAt: null,
    totalScore: 0,
    maxScore: 10,
  },
  {
    id: 's4',
    candidateName: 'Dana',
    candidateEmail: 'dana@test.com',
    status: 'SUBMITTED',
    startedAt: '2026-08-01T00:00:00.000Z',
    submittedAt: '2026-08-01T01:00:00.000Z',
    totalScore: 0,
    maxScore: 0,
  },
];

describe('AssessmentSubmissions', () => {
  let component: AssessmentSubmissions;
  let fixture: ComponentFixture<AssessmentSubmissions>;
  let getSubmissions: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getSubmissions = vi.fn().mockReturnValue(of(submissions));
    navigate = vi.fn();

    await TestBed.configureTestingModule({
      imports: [AssessmentSubmissions],
      providers: [
        { provide: AssessmentService, useValue: { getSubmissions } },
        { provide: Router, useValue: { navigate } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentSubmissions);
    fixture.componentRef.setInput('assessmentId', 'a1');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('loads submissions for the given assessmentId into the table data source', () => {
    expect(getSubmissions).toHaveBeenCalledWith('a1');
    expect(component.dataSource.data).toEqual(submissions);
    expect(component.loading()).toBe(false);
  });

  it('passPercent rounds to a whole number', () => {
    expect(component.passPercent(submissions[0])).toBe(80);
    expect(component.passPercent(submissions[1])).toBe(30);
  });

  it('passPercent is 0 (not NaN) when maxScore is 0', () => {
    expect(component.passPercent(submissions[3])).toBe(0);
  });

  it('passed is true only for a SUBMITTED candidate at/above the passing bar', () => {
    expect(component.passed(submissions[0])).toBe(80 >= environment.passingScorePercent);
    expect(component.passed(submissions[1])).toBe(false);
  });

  it('passed is false for a candidate still IN_PROGRESS, regardless of score', () => {
    const highScoreInProgress: SubmissionSummary = { ...submissions[2], totalScore: 10, maxScore: 10 };
    expect(component.passed(highScoreInProgress)).toBe(false);
  });

  it('sortingDataAccessor computes passPercent/passed for those columns and reads plain fields otherwise', () => {
    const accessor = component.dataSource.sortingDataAccessor;
    expect(accessor(submissions[0], 'passPercent')).toBe(80);
    expect(accessor(submissions[0], 'passed')).toBe(component.passed(submissions[0]) ? 1 : 0);
    expect(accessor(submissions[0], 'candidateName')).toBe('Ana');
  });

  it('openResult navigates to the submission result screen', () => {
    component.openResult(submissions[0]);

    expect(navigate).toHaveBeenCalledWith(['/recruiter/assessments', 'a1', 'submissions', 's1']);
  });
});
