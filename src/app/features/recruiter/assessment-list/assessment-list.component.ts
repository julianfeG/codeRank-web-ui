import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AssessmentService } from '../../../core/services/assessment.service';
import { DifficultyBadge } from '../../../shared/components/difficulty-badge/difficulty-badge.component';
import { AssessmentQuestionRef, AssessmentSummary } from '../../../shared/models';
import { DeleteAssessmentDialog } from './delete-assessment-dialog/delete-assessment-dialog.component';

/** Recruiter home: list of assessments + "Crear assessment" entry point. */
@Component({
  selector: 'app-assessment-list',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    RouterLink,
    DifficultyBadge,
  ],
  templateUrl: './assessment-list.component.html',
  styleUrl: './assessment-list.component.scss',
})
export class AssessmentList {
  private readonly assessmentService = inject(AssessmentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly assessments = signal<AssessmentSummary[]>([]);
  readonly loading = signal(false);
  readonly isEmpty = computed(() => !this.loading() && this.assessments().length === 0);

  /** Id of the row currently expanded to show its questions — only one at a time. */
  readonly expandedId = signal<string | null>(null);
  /** Id of the assessment whose questions are being fetched, to show a per-row spinner. */
  readonly loadingQuestionsId = signal<string | null>(null);
  /** Lazy per-assessment questions cache keyed by assessment id — filled the first time a row is expanded. */
  private readonly questionsCache = signal<Map<string, AssessmentQuestionRef[]>>(new Map());
  /** Id of the assessment currently being deleted, to disable its trash button while the request is in flight. */
  readonly deletingId = signal<string | null>(null);

  constructor() {
    this.loading.set(true);
    this.assessmentService.getAssessments().subscribe({
      next: (assessments) => {
        this.assessments.set(assessments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  copyStartLink(assessment: AssessmentSummary): void {
    const url = `${window.location.origin}/candidate/start/${assessment.id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copiado', 'Cerrar', { duration: 3000 });
    });
  }

  openSubmissions(assessment: AssessmentSummary): void {
    this.router.navigate(['/recruiter/assessments', assessment.id, 'submissions']);
  }

  questionsFor(assessmentId: string): AssessmentQuestionRef[] | undefined {
    return this.questionsCache().get(assessmentId);
  }

  /** Toggles a row's expanded panel, fetching its questions from the backend only on the first expand. */
  toggleExpand(assessment: AssessmentSummary): void {
    if (this.expandedId() === assessment.id) {
      this.expandedId.set(null);
      return;
    }

    this.expandedId.set(assessment.id);

    if (this.questionsCache().has(assessment.id)) {
      return;
    }

    this.loadingQuestionsId.set(assessment.id);
    this.assessmentService.getAssessment(assessment.id).subscribe({
      next: (detail) => {
        const sorted = [...detail.assessmentQuestions].sort((a, b) => a.order - b.order);
        this.questionsCache.update((cache) => new Map(cache).set(assessment.id, sorted));
        this.loadingQuestionsId.set(null);
      },
      error: () => {
        // Nothing to show — collapse back instead of leaving the panel stuck loading.
        // The error.interceptor already surfaced the snackbar for this failure.
        this.loadingQuestionsId.set(null);
        this.expandedId.set(null);
      },
    });
  }

  deleteAssessment(assessment: AssessmentSummary): void {
    const ref = this.dialog.open(DeleteAssessmentDialog, {
      data: { assessment },
      width: '420px',
    });

    ref.afterClosed().subscribe((confirmed: boolean | undefined) => {
      if (!confirmed) {
        return;
      }

      this.deletingId.set(assessment.id);
      this.assessmentService.deleteAssessment(assessment.id).subscribe({
        next: () => {
          this.deletingId.set(null);
          this.assessments.update((list) => list.filter((a) => a.id !== assessment.id));
          if (this.expandedId() === assessment.id) {
            this.expandedId.set(null);
          }
          this.snackBar.open('Assessment eliminado', 'Cerrar', { duration: 3000 });
        },
        // error.interceptor already surfaces the failure via snackbar.
        error: () => this.deletingId.set(null),
      });
    });
  }
}
