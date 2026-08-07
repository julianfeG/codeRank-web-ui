import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { Router } from '@angular/router';
import { AssessmentService } from '../../../core/services/assessment.service';
import { SubmissionService } from '../../../core/services/submission.service';
import { CodeRunner } from '../../../shared/components/code-runner/code-runner.component';
import { AssessmentDetail } from '../../../shared/models';

/**
 * Renders MULTIPLE_CHOICE questions (MatRadioGroup) and CODE questions
 * (Monaco via app-code-runner), then submits the whole assessment.
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

  readonly orderedQuestions = computed(
    () => [...(this.assessment()?.assessmentQuestions ?? [])].sort((a, b) => a.order - b.order),
  );

  constructor() {
    effect(() => {
      const id = this.submissionId();
      this.loading.set(true);
      // GET /submissions/:id gives us the assessmentId; the questions themselves
      // (with statement/options/starterCodeTemplates) only live on GET /assessments/:id.
      this.submissionService.getSubmission(id).subscribe({
        next: ({ submission }) => {
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
