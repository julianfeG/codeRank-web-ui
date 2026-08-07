import { Component, effect, inject, input, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { AssessmentService } from '../../../core/services/assessment.service';
import { SubmissionSummary } from '../../../shared/models';

/** Candidate table for one assessment; clicking a row opens the shared submission result. */
@Component({
  selector: 'app-assessment-submissions',
  imports: [MatTableModule],
  templateUrl: './assessment-submissions.component.html',
  styleUrl: './assessment-submissions.component.scss',
})
export class AssessmentSubmissions {
  private readonly assessmentService = inject(AssessmentService);
  private readonly router = inject(Router);

  /** Bound automatically from the :assessmentId route param (withComponentInputBinding). */
  readonly assessmentId = input.required<string>();

  readonly displayedColumns = ['candidateName', 'candidateEmail', 'status', 'totalScore'];
  readonly submissions = signal<SubmissionSummary[]>([]);
  readonly loading = signal(false);

  constructor() {
    effect(() => {
      const id = this.assessmentId();
      this.loading.set(true);
      this.assessmentService.getSubmissions(id).subscribe({
        next: (submissions) => {
          this.submissions.set(submissions);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  openResult(submission: SubmissionSummary): void {
    this.router.navigate(['/recruiter/assessments', this.assessmentId(), 'submissions', submission.id]);
  }
}
