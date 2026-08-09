import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { DifficultyBadge } from '../../../shared/components/difficulty-badge/difficulty-badge.component';
import { QuestionForm } from '../../../shared/components/question-form/question-form.component';
import { QuestionService } from '../../../core/services/question.service';
import { Difficulty, QUESTION_CATEGORIES, Question } from '../../../shared/models';

/** Display labels for CODE allowedLanguages — same catalog question-form uses to build the picker. */
const LANGUAGE_LABELS: Record<string, string> = { javascript: 'JavaScript', python: 'Python', java: 'Java' };

/** Sentinel option value for "no filter" in the category/difficulty selects — kept out of the query params. */
const ALL = '' as const;

/**
 * Recruiter's question bank: every question that exists, independent of any
 * one assessment — browse, filter, add new ones (same QuestionForm dialog
 * create-assessment's "+ Nueva pregunta" uses), and expand a row to see its
 * full detail (options + correct answer, or languages/testCases) instead of
 * just the truncated one-line statement create-assessment's picker shows.
 */
@Component({
  selector: 'app-question-bank',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    DifficultyBadge,
  ],
  templateUrl: './question-bank.component.html',
  styleUrl: './question-bank.component.scss',
})
export class QuestionBank {
  private readonly questionService = inject(QuestionService);
  private readonly dialog = inject(MatDialog);

  readonly categories = QUESTION_CATEGORIES;
  readonly difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
  readonly categoryFilter = signal<string>(ALL);
  readonly difficultyFilter = signal<Difficulty | typeof ALL>(ALL);

  readonly questions = signal<Question[]>([]);
  readonly loading = signal(false);
  readonly isEmpty = computed(() => !this.loading() && this.questions().length === 0);

  /** Id of the row currently expanded to show its full detail — only one at a time. */
  readonly expandedId = signal<string | null>(null);

  constructor() {
    this.loadQuestions();
  }

  private loadQuestions(): void {
    const category = this.categoryFilter();
    const difficulty = this.difficultyFilter();
    this.loading.set(true);
    this.questionService
      .getQuestions({
        category: category === ALL ? undefined : category,
        difficulty: difficulty === ALL ? undefined : difficulty,
      })
      .subscribe({
        next: (questions) => {
          this.questions.set(questions);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onCategoryFilterChange(category: string): void {
    this.categoryFilter.set(category);
    this.loadQuestions();
  }

  onDifficultyFilterChange(difficulty: Difficulty | typeof ALL): void {
    this.difficultyFilter.set(difficulty);
    this.loadQuestions();
  }

  toggleExpand(question: Question): void {
    this.expandedId.set(this.expandedId() === question.id ? null : question.id);
  }

  languageLabel(code: string): string {
    return LANGUAGE_LABELS[code] ?? code;
  }

  /** Strings render as-typed; everything else (numbers, arrays, objects, booleans) as JSON so it's readable. */
  formatValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  openNewQuestionDialog(): void {
    const isNarrow = window.matchMedia('(max-width: 600px)').matches;
    const ref = this.dialog.open(QuestionForm, {
      width: isNarrow ? '96vw' : '90vw',
      maxWidth: isNarrow ? '96vw' : '1100px',
      maxHeight: '90vh',
      panelClass: 'question-dialog-panel',
    });
    ref.afterClosed().subscribe((created: Question | undefined) => {
      if (created) {
        // Reload (instead of prepending) so the new question only shows up if it
        // actually matches whatever category/difficulty filters are active.
        this.loadQuestions();
      }
    });
  }
}
