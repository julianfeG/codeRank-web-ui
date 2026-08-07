import { Component, effect, inject, input, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { SubmissionService } from '../../core/services/submission.service';
import { SubmissionResult } from '../models';
import { TestResultsView } from '../components/test-results/test-results.component';

/**
 * Neutral result screen — mounted both from the candidate's own flow
 * (/candidate/submissions/:submissionId/results) and from the recruiter
 * clicking a candidate row (/recruiter/assessments/:assessmentId/submissions/:submissionId).
 */
@Component({
  selector: 'app-submission-result',
  imports: [MatCardModule, MatChipsModule, TestResultsView],
  templateUrl: './submission-result.component.html',
  styleUrl: './submission-result.component.scss',
})
export class SubmissionResultView {
  private readonly submissionService = inject(SubmissionService);

  /** Bound automatically from the :submissionId route param (withComponentInputBinding). */
  readonly submissionId = input.required<string>();

  readonly result = signal<SubmissionResult | null>(null);
  readonly loading = signal(false);

  constructor() {
    effect(() => {
      const id = this.submissionId();
      this.loading.set(true);
      this.submissionService.getSubmission(id).subscribe({
        next: (result) => {
          this.result.set(result);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }
}
