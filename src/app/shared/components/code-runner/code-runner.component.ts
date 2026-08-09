import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SubmissionService } from '../../../core/services/submission.service';
import { SubmissionAnswer } from '../../models';
import { TestResultsView } from '../test-results/test-results.component';

/** Display labels for the languages the backend currently supports — falls back to the raw code for anything unlisted. */
const LANGUAGE_LABELS: Record<string, string> = { javascript: 'JavaScript', python: 'Python', java: 'Java' };

/**
 * Language picker + Monaco editor + Ejecutar, reused in resolve-assessment.
 * There's no explicit "Guardar" button — the code is auto-saved (saveAnswer)
 * once the candidate stops typing for environment.codeAutoSaveIdleMs.
 * "Ejecutar" saves immediately and then runs it (run-code requires an answer
 * to already exist for the question).
 */
@Component({
  selector: 'app-code-runner',
  imports: [FormsModule, EditorComponent, MatButtonModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, TestResultsView],
  templateUrl: './code-runner.component.html',
  styleUrl: './code-runner.component.scss',
})
export class CodeRunner {
  private readonly submissionService = inject(SubmissionService);

  readonly submissionId = input.required<string>();
  readonly questionId = input.required<string>();
  readonly allowedLanguages = input.required<string[]>();
  /** Keyed by language code, e.g. { javascript: '...', python: '...' }. */
  readonly starterCodeTemplates = input<Record<string, string> | null>(null);
  /**
   * Previously saved answer for this question, if any — rehydrates the editor after a
   * reload instead of starting from the starter template. Set once by the parent from
   * GET /submissions/:id and expected to stay referentially stable afterwards.
   */
  readonly savedAnswer = input<SubmissionAnswer | null>(null);

  /** null until the candidate explicitly picks one — falls back to the saved answer's language, then the first allowed one. */
  private readonly explicitLanguage = signal<string | null>(null);
  readonly selectedLanguage = computed(
    () => this.explicitLanguage() ?? this.savedAnswer()?.language ?? this.allowedLanguages()[0] ?? null,
  );
  readonly runDisabled = computed(() => !this.selectedLanguage());

  readonly code = signal('');
  readonly saving = signal(false);
  readonly running = signal(false);
  readonly result = signal<SubmissionAnswer | null>(null);

  /** Emits on every keystroke from the candidate (not on programmatic code.set()) — drives the idle auto-save. */
  private readonly codeEdited$ = new Subject<void>();

  readonly editorOptions = computed(() => ({ theme: 'vs-dark', language: this.selectedLanguage() ?? 'javascript' }));

  constructor() {
    // Single source of truth for the editor's content: reloads it from
    // starterCodeTemplates every time the effective language changes — both the
    // initial default-language resolution and any later explicit switch via
    // selectLanguage(). Per the MVP, no per-language draft is kept, so unsaved
    // edits in the previously selected language are lost on switch. The one
    // exception is the saved answer for the language it was submitted in: that
    // rehydrates the candidate's own code instead of the blank starter template.
    effect(() => {
      const language = this.selectedLanguage();
      const saved = this.savedAnswer();
      if (language && saved?.language === language && saved.submittedCode != null) {
        this.code.set(saved.submittedCode);
      } else {
        this.code.set(language ? (this.starterCodeTemplates()?.[language] ?? '') : '');
      }
    });

    // Show test results from a previous run (before the connection dropped) as if the
    // candidate had just run it — only fires while nothing has been run yet in this
    // session, so it never clobbers a fresh run() result.
    effect(() => {
      const saved = this.savedAnswer();
      if (saved?.testResults && !this.result()) {
        this.result.set(saved);
      }
    });

    // No explicit "Guardar" button — once the candidate stops typing for
    // environment.codeAutoSaveIdleMs, persist whatever is in the editor, same as the old button did.
    this.codeEdited$
      .pipe(debounceTime(environment.codeAutoSaveIdleMs), takeUntilDestroyed())
      .subscribe(() => this.save());
  }

  languageLabel(code: string): string {
    return LANGUAGE_LABELS[code] ?? code;
  }

  selectLanguage(language: string): void {
    this.explicitLanguage.set(language);
  }

  onCodeChange(value: string): void {
    this.code.set(value);
    this.codeEdited$.next();
  }

  private save(): void {
    const language = this.selectedLanguage();
    if (!language || this.saving() || this.running()) {
      return;
    }
    this.saving.set(true);
    this.submissionService
      .saveAnswer(this.submissionId(), { questionId: this.questionId(), submittedCode: this.code(), language })
      .subscribe({
        next: () => this.saving.set(false),
        error: () => this.saving.set(false),
      });
  }

  run(): void {
    const language = this.selectedLanguage();
    if (!language || this.runDisabled() || this.running()) {
      return;
    }
    this.running.set(true);
    this.submissionService
      .saveAnswer(this.submissionId(), { questionId: this.questionId(), submittedCode: this.code(), language })
      .pipe(switchMap(() => this.submissionService.runCode(this.submissionId(), { questionId: this.questionId() })))
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.running.set(false);
        },
        error: () => this.running.set(false),
      });
  }
}
