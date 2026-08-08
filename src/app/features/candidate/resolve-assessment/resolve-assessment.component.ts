import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { Router } from '@angular/router';
import { AssessmentService } from '../../../core/services/assessment.service';
import { SubmissionService } from '../../../core/services/submission.service';
import { CodeRunner } from '../../../shared/components/code-runner/code-runner.component';
import { AssessmentDetail, SubmissionAnswer } from '../../../shared/models';

/**
 * Renders MULTIPLE_CHOICE questions (MatRadioGroup) and CODE questions
 * (Monaco via app-code-runner), then submits the whole assessment.
 *
 * Rehydrates from GET /submissions/:id on load, so a reload (lost connection,
 * accidental refresh) restores previously saved MC selections and CODE
 * answers/test results instead of starting blank. If the submission was
 * already SUBMITTED (e.g. the candidate finished right before dropping
 * connection), it redirects straight to the result screen instead of showing
 * an editable form for something already closed.
 */
@Component({
  selector: 'app-resolve-assessment',
  imports: [MatRadioModule, MatButtonModule, CodeRunner],
  templateUrl: './resolve-assessment.component.html',
  styleUrl: './resolve-assessment.component.scss',
})
export class ResolveAssessment {
  private readonly assessmentService = inject(AssessmentService);
  private readonly submissionService = inject(SubmissionService);
  private readonly router = inject(Router);

  /** Bound automatically from the :submissionId route param (withComponentInputBinding). */
  readonly submissionId = input.required<string>();

  readonly assessment = signal<AssessmentDetail | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  /** questionId -> selectedOptionId, for MULTIPLE_CHOICE questions. */
  readonly mcAnswers = signal<Record<string, string>>({});
  /** questionId -> previously saved answer, for CODE questions (passed down to app-code-runner). */
  readonly savedCodeAnswers = signal<Record<string, SubmissionAnswer>>({});

  readonly orderedQuestions = computed(
    () => [...(this.assessment()?.assessmentQuestions ?? [])].sort((a, b) => a.order - b.order),
  );

  constructor() {
    effect(() => {
      const id = this.submissionId();
      this.loading.set(true);
      // GET /submissions/:id gives us both the assessmentId and the candidate's
      // already-saved answers (if this isn't the first time they land here); the
      // questions themselves (statement/options/starterCodeTemplates) only live
      // on GET /assessments/:id.
      this.submissionService.getSubmission(id).subscribe({
        next: ({ submission, answers }) => {
          if (submission.status === 'SUBMITTED') {
            // Already closed — nothing left to resolve, go straight to the result.
            this.router.navigate(['/candidate/submissions', id, 'results']);
            return;
          }

          this.mcAnswers.set(
            Object.fromEntries(
              answers.filter((a) => a.selectedOptionId != null).map((a) => [a.questionId, a.selectedOptionId!]),
            ),
          );
          this.savedCodeAnswers.set(
            Object.fromEntries(
              answers.filter((a) => a.submittedCode != null).map((a) => [a.questionId, a]),
            ),
          );

          this.assessmentService.getAssessment(submission.assessmentId).subscribe({
            next: (assessment) => {
              this.assessment.set(assessment);
              this.loading.set(false);
            },
            error: () => this.loading.set(false),
          });
        },
        error: () => this.loading.set(false),
      });
    });
  }

  selectMcOption(questionId: string, optionId: string): void {
    this.mcAnswers.update((answers) => ({ ...answers, [questionId]: optionId }));
    this.submissionService
      .saveAnswer(this.submissionId(), { questionId, selectedOptionId: optionId })
      .subscribe();
  }

  submitAssessment(): void {
    // TODO: replace with a MatDialog confirmation.
    if (!confirm('¿Enviar el assessment? No podrás modificar tus respuestas después.')) {
      return;
    }

    this.submitting.set(true);
    this.submissionService.submit(this.submissionId()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/candidate/submissions', this.submissionId(), 'results']);
      },
      error: () => this.submitting.set(false),
    });
  }
}
