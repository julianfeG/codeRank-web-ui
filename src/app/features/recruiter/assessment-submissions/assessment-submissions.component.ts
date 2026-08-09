import { Component, effect, inject, input, signal, viewChild } from '@angular/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AssessmentService } from '../../../core/services/assessment.service';
import { SubmissionSummary } from '../../../shared/models';

/** Candidate table for one assessment; clicking a row opens the shared submission result. */
@Component({
  selector: 'app-assessment-submissions',
  imports: [MatTableModule, MatSortModule],
  templateUrl: './assessment-submissions.component.html',
  styleUrl: './assessment-submissions.component.scss',
})
export class AssessmentSubmissions {
  private readonly assessmentService = inject(AssessmentService);
  private readonly router = inject(Router);

  /** Bound automatically from the :assessmentId route param (withComponentInputBinding). */
  readonly assessmentId = input.required<string>();

  readonly displayedColumns = [
    'candidateName',
    'candidateEmail',
    'status',
    'totalScore',
    'passPercent',
    'passed',
  ];
  readonly dataSource = new MatTableDataSource<SubmissionSummary>([]);
  readonly loading = signal(false);

  /**
   * The table (and its mat-sort-header directives) only exist in the DOM once
   * `loading()` flips to false, so this resolves after that first load rather
   * than at construction time — the effect below re-wires it once it does.
   */
  private readonly sort = viewChild(MatSort);

  constructor() {
    effect(() => {
      const id = this.assessmentId();
      this.loading.set(true);
      this.assessmentService.getSubmissions(id).subscribe({
        next: (submissions) => {
          this.dataSource.data = submissions;
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });

    effect(() => {
      const sort = this.sort();
      if (sort) {
        this.dataSource.sort = sort;
      }
    });

    // Default sort accessor reads properties directly off SubmissionSummary,
    // which doesn't have passPercent/passed — compute those for sorting.
    this.dataSource.sortingDataAccessor = (submission, property) => {
      switch (property) {
        case 'passPercent':
          return this.passPercent(submission);
        case 'passed':
          return this.passed(submission) ? 1 : 0;
        default:
          return submission[property as keyof SubmissionSummary] as string | number;
      }
    };
  }

  openResult(submission: SubmissionSummary): void {
    this.router.navigate(['/recruiter/assessments', this.assessmentId(), 'submissions', submission.id]);
  }

  /** Score as a whole-number percentage; 0 when maxScore is 0 (no scored questions yet) rather than NaN. */
  passPercent(submission: SubmissionSummary): number {
    if (submission.maxScore <= 0) {
      return 0;
    }
    return Math.round((submission.totalScore / submission.maxScore) * 100);
  }

  /** Whether the candidate cleared the passing bar — only decided once the submission is actually finished. */
  passed(submission: SubmissionSummary): boolean {
    return submission.status === 'SUBMITTED' && this.passPercent(submission) >= environment.passingScorePercent;
  }
}
