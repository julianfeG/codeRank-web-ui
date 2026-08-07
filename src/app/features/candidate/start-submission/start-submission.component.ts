import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AssessmentService } from '../../../core/services/assessment.service';
import { SubmissionService } from '../../../core/services/submission.service';
import { AssessmentDetail } from '../../../shared/models';

/** Rough estimate for the subtitle only — there's no per-question timing data to draw from. */
const MINUTES_PER_QUESTION = 9;

/** Candidate entry screen (name/email) → POST /submissions, then navigates to resolve-assessment. */
@Component({
  selector: 'app-start-submission',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './start-submission.component.html',
  styleUrl: './start-submission.component.scss',
})
export class StartSubmission {
  private readonly fb = inject(FormBuilder);
  private readonly assessmentService = inject(AssessmentService);
  private readonly submissionService = inject(SubmissionService);
  private readonly router = inject(Router);

  /** Bound automatically from the :assessmentId route param (withComponentInputBinding). */
  readonly assessmentId = input.required<string>();

  readonly assessment = signal<AssessmentDetail | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly questionCount = computed(() => this.assessment()?.assessmentQuestions.length ?? 0);
  readonly estimatedMinutes = computed(() => this.questionCount() * MINUTES_PER_QUESTION);

  readonly form = this.fb.nonNullable.group({
    candidateName: this.fb.nonNullable.control('', Validators.required),
    candidateEmail: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
  });

  // `form.valid` is a plain getter, not a signal — reading it inside a computed() would
  // register no dependency, so it's bridged from statusChanges (same pattern as
  // create-assessment's canSubmit).
  private readonly formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });
  readonly canSubmit = computed(() => this.formStatus() === 'VALID');

  constructor() {
    effect(() => {
      const id = this.assessmentId();
      this.loading.set(true);
      this.assessmentService.getAssessment(id).subscribe({
        next: (assessment) => {
          this.assessment.set(assessment);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  submit(): void {
    if (!this.canSubmit() || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.submissionService
      .createSubmission({ assessmentId: this.assessmentId(), ...this.form.getRawValue() })
      .subscribe({
        next: (submission) => {
          this.saving.set(false);
          this.router.navigate(['/candidate/submissions', submission.id, 'resolve']);
        },
        error: () => this.saving.set(false),
      });
  }
}
