import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { switchMap } from 'rxjs';
import { SubmissionService } from '../../../core/services/submission.service';
import { SubmissionAnswer } from '../../models';
import { TestResultsView } from '../test-results/test-results.component';

/** Display labels for the languages the backend currently supports — falls back to the raw code for anything unlisted. */
const LANGUAGE_LABELS: Record<string, string> = { javascript: 'JavaScript', python: 'Python' };

/** Languages the backend can't execute yet — run-code would 4xx, so the UI blocks it instead of round-tripping the error. */
const RUN_UNSUPPORTED_LANGUAGES = new Set(['python']);

/**
 * Language picker + Monaco editor + Guardar/Ejecutar, reused in resolve-assessment.
 * "Guardar" only upserts the answer (saveAnswer); "Ejecutar" does that too and then
 * runs it (run-code requires an answer to already exist for the question).
 */
@Component({
  selector: 'app-code-runner',
  imports: [FormsModule, EditorComponent, MatButtonModule, MatButtonToggleModule, MatTooltipModule, MatProgressSpinnerModule, TestResultsView],
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

  readonly pythonHint = 'Python aún no soportado para ejecución — próximamente vía Judge0.';

  /** null until the candidate explicitly picks one — falls back to the first allowed language below. */
  private readonly explicitLanguage = signal<string | null>(null);
  readonly selectedLanguage = computed(() => this.explicitLanguage() ?? this.allowedLanguages()[0] ?? null);
  readonly runDisabled = computed(() => {
    const lang = this.selectedLanguage();
    return !lang || RUN_UNSUPPORTED_LANGUAGES.has(lang);
  });

  readonly code = signal('');
  readonly saving = signal(false);
  readonly running = signal(false);
  readonly result = signal<SubmissionAnswer | null>(null);

  readonly editorOptions = computed(() => ({ theme: 'vs-dark', language: this.selectedLanguage() ?? 'javascript' }));

  constructor() {
    // Single source of truth for the editor's content: reloads it from
    // starterCodeTemplates every time the effective language changes — both the
    // initial default-language resolution and any later explicit switch via
    // selectLanguage(). Per the MVP, no per-language draft is kept, so unsaved
    // edits in the previously selected language are lost on switch.
    effect(() => {
      const language = this.selectedLanguage();
      this.code.set(language ? (this.starterCodeTemplates()?.[language] ?? '') : '');
    });
  }

  languageLabel(code: string): string {
    return LANGUAGE_LABELS[code] ?? code;
  }

  selectLanguage(language: string): void {
    this.explicitLanguage.set(language);
  }

  save(): void {
    const language = this.selectedLanguage();
    if (!language || this.saving()) {
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
