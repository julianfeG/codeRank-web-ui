import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssessmentService } from '../../../core/services/assessment.service';
import { AssessmentDetail, AssessmentSummary, EmbeddedQuestion } from '../../../shared/models';
import { AssessmentList } from './assessment-list.component';

const assessments: AssessmentSummary[] = [
  { id: 'a1', title: 'Kata Fullstack', description: '', createdAt: '2026-08-01T00:00:00.000Z', questionCount: 3, submissionCount: 2 },
  { id: 'a2', title: 'Java assessment', description: '', createdAt: '2026-08-02T00:00:00.000Z', questionCount: 1, submissionCount: 0 },
];

const stubQuestion: EmbeddedQuestion = {
  category: 'Algorithms',
  difficulty: 'EASY',
  type: 'MULTIPLE_CHOICE',
  statement: 'stub',
  allowedLanguages: [],
  starterCodeTemplates: null,
  options: [],
};

const detail: AssessmentDetail = {
  id: 'a1',
  title: 'Kata Fullstack',
  description: '',
  createdAt: '2026-08-01T00:00:00.000Z',
  assessmentQuestions: [
    { questionId: 'q2', order: 1, question: stubQuestion },
    { questionId: 'q1', order: 0, question: stubQuestion },
  ],
};

describe('AssessmentList', () => {
  let component: AssessmentList;
  let fixture: ComponentFixture<AssessmentList>;
  let getAssessments: ReturnType<typeof vi.fn>;
  let getAssessment: ReturnType<typeof vi.fn>;
  let deleteAssessment: ReturnType<typeof vi.fn>;
  let dialogOpen: ReturnType<typeof vi.fn>;
  let snackBarOpen: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  async function createFixture(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [AssessmentList],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AssessmentService, useValue: { getAssessments, getAssessment, deleteAssessment } },
        { provide: MatDialog, useValue: { open: dialogOpen } },
        { provide: MatSnackBar, useValue: { open: snackBarOpen } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentList);
    component = fixture.componentInstance;
    await fixture.whenStable();

    // Router is injected in the constructor above via DI — override navigate on the real instance.
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(() => Promise.resolve(true));
  }

  beforeEach(() => {
    getAssessments = vi.fn().mockReturnValue(of(assessments));
    getAssessment = vi.fn().mockReturnValue(of(detail));
    deleteAssessment = vi.fn().mockReturnValue(of(undefined));
    dialogOpen = vi.fn();
    snackBarOpen = vi.fn();

    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads and exposes the assessment list', async () => {
    await createFixture();

    expect(getAssessments).toHaveBeenCalled();
    expect(component.assessments()).toEqual(assessments);
    expect(component.loading()).toBe(false);
    expect(component.isEmpty()).toBe(false);
  });

  it('isEmpty is true once loading finishes with no assessments', async () => {
    getAssessments.mockReturnValue(of([]));
    await createFixture();

    expect(component.isEmpty()).toBe(true);
  });

  it('toggleExpand sets expandedId and fetches the assessment questions, sorted by order', async () => {
    await createFixture();

    component.toggleExpand(assessments[0]);
    await fixture.whenStable();

    expect(component.expandedId()).toBe('a1');
    expect(getAssessment).toHaveBeenCalledWith('a1');
    expect(component.questionsFor('a1')?.map((q) => q.questionId)).toEqual(['q1', 'q2']);
  });

  it('toggleExpand on the same row again collapses it without refetching', async () => {
    await createFixture();
    component.toggleExpand(assessments[0]);
    await fixture.whenStable();
    getAssessment.mockClear();

    component.toggleExpand(assessments[0]);

    expect(component.expandedId()).toBeNull();
    expect(getAssessment).not.toHaveBeenCalled();
  });

  it('re-expanding a previously expanded row reuses the cache instead of refetching', async () => {
    await createFixture();
    component.toggleExpand(assessments[0]);
    await fixture.whenStable();
    component.toggleExpand(assessments[0]); // collapse
    getAssessment.mockClear();

    component.toggleExpand(assessments[0]); // expand again

    expect(getAssessment).not.toHaveBeenCalled();
    expect(component.questionsFor('a1')).toBeDefined();
  });

  it('toggleExpand collapses back on a failed fetch', async () => {
    getAssessment.mockReturnValue(throwError(() => new Error('boom')));
    await createFixture();

    component.toggleExpand(assessments[0]);
    await fixture.whenStable();

    expect(component.expandedId()).toBeNull();
    expect(component.loadingQuestionsId()).toBeNull();
  });

  it('copyStartLink copies the candidate start URL and shows a snackbar', async () => {
    await createFixture();

    component.copyStartLink(assessments[0]);
    await Promise.resolve();

    expect((navigator.clipboard.writeText as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      `${window.location.origin}/candidate/start/a1`,
    );
    expect(snackBarOpen).toHaveBeenCalledWith('Link copiado', 'Cerrar', { duration: 3000 });
  });

  it('openSubmissions navigates to the assessment submissions screen', async () => {
    await createFixture();

    component.openSubmissions(assessments[0]);

    expect(navigate).toHaveBeenCalledWith(['/recruiter/assessments', 'a1', 'submissions']);
  });

  it('deleteAssessment does nothing when the confirmation dialog is dismissed', async () => {
    dialogOpen.mockReturnValue({ afterClosed: () => of(false) });
    await createFixture();

    component.deleteAssessment(assessments[0]);
    await fixture.whenStable();

    expect(deleteAssessment).not.toHaveBeenCalled();
    expect(component.assessments()).toEqual(assessments);
  });

  it('deleteAssessment removes the row and shows a snackbar when confirmed', async () => {
    dialogOpen.mockReturnValue({ afterClosed: () => of(true) });
    await createFixture();

    component.deleteAssessment(assessments[0]);
    await fixture.whenStable();

    expect(deleteAssessment).toHaveBeenCalledWith('a1');
    expect(component.assessments().map((a) => a.id)).toEqual(['a2']);
    expect(snackBarOpen).toHaveBeenCalledWith('Assessment eliminado', 'Cerrar', { duration: 3000 });
    expect(component.deletingId()).toBeNull();
  });

  it('deleteAssessment also collapses the row if it was the expanded one', async () => {
    dialogOpen.mockReturnValue({ afterClosed: () => of(true) });
    await createFixture();
    component.toggleExpand(assessments[0]);
    await fixture.whenStable();

    component.deleteAssessment(assessments[0]);
    await fixture.whenStable();

    expect(component.expandedId()).toBeNull();
  });
});
