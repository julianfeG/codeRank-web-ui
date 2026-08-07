import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AssessmentService } from '../../../core/services/assessment.service';
import { AuthService } from '../../../core/services/auth.service';
import { AssessmentSummary } from '../../../shared/models';

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
  ],
  templateUrl: './assessment-list.component.html',
  styleUrl: './assessment-list.component.scss',
})
export class AssessmentList {
  private readonly assessmentService = inject(AssessmentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly assessments = signal<AssessmentSummary[]>([]);
  readonly loading = signal(false);
  readonly isEmpty = computed(() => !this.loading() && this.assessments().length === 0);

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
}
