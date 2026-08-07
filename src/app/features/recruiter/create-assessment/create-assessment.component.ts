import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AssessmentService } from '../../../core/services/assessment.service';
import { QuestionService } from '../../../core/services/question.service';
import { QuestionCard } from '../../../shared/components/question-card/question-card.component';
import { QuestionForm } from '../../../shared/components/question-form/question-form.component';
import { Question } from '../../../shared/models';

/** Question bank in selection mode (checkboxes) + title/description form to create an assessment. */
@Component({
  selector: 'app-create-assessment',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, QuestionCard],
  templateUrl: './create-assessment.component.html',
  styleUrl: './create-assessment.component.scss',
})
export class CreateAssessment {
  private readonly fb = inject(FormBuilder);
  private readonly questionService = inject(QuestionService);
  private readonly assessmentService = inject(AssessmentService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    title: this.fb.nonNullable.control('', Validators.required),
    // Optional: the backend doesn't require it either (POST /assessments only
    // flags title/questionIds as missing), and it shouldn't gate the button.
    description: this.fb.nonNullable.control(''),
  });

  readonly questions = signal<Question[]>([]);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly saving = signal(false);

  // `form.valid` is a plain getter, not a signal — reading it inside a
  // computed() registers no dependency, so it must be bridged from
  // statusChanges. (Bridging it also fixes a subtler bug: the old
  // `this.form.valid && this.selectedIds().size > 0` short-circuited on
  // the very first — invalid — evaluation, so `selectedIds()` was never
  // read and the computed had zero tracked dependencies, freezing
  // canSubmit at `false` forever regardless of later input.)
  private readonly formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });
  readonly canSubmit = computed(() => {
    const isValid = this.formStatus() === 'VALID';
    const hasSelection = this.selectedIds().size > 0;
    return isValid && hasSelection;
  });

  constructor() {
    this.questionService.getQuestions().subscribe({
      next: (questions) => this.questions.set(questions),
      error: () => this.questions.set([]),
    });
  }

  toggleSelection(id: string, checked: boolean): void {
    const next = new Set(this.selectedIds());
    checked ? next.add(id) : next.delete(id);
    this.selectedIds.set(next);
  }

  openNewQuestionDialog(): void {
    // Close to viewport-filling so statement/starterCode/expectedOutput
    // textareas have room to actually write in. On narrow screens 90vw with
    // a 1100px cap would still feel cramped, so go closer to full width.
    const isNarrow = window.matchMedia('(max-width: 600px)').matches;
    const ref = this.dialog.open(QuestionForm, {
      width: isNarrow ? '96vw' : '90vw',
      maxWidth: isNarrow ? '96vw' : '1100px',
      height: '90vh',
      maxHeight: '90vh',
    });
    ref.afterClosed().subscribe((created: Question | undefined) => {
      if (created) {
        this.questions.update((qs) => [...qs, created]);
      }
    });
  }

  submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    this.saving.set(true);
    this.assessmentService
      .createAssessment({
        ...this.form.getRawValue(),
        questionIds: [...this.selectedIds()],
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/recruiter']);
        },
        error: () => this.saving.set(false),
      });
  }
}
