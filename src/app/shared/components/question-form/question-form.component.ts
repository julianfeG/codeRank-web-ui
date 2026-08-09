import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { startWith } from 'rxjs';
import { QuestionService } from '../../../core/services/question.service';
import { Difficulty, QUESTION_CATEGORIES, Question, QuestionType, TestCase } from '../../models';

type CodeLanguage = 'javascript' | 'python' | 'java';

/** The only languages the backend currently accepts for CODE questions — hardcoded, no catalog endpoint exists. Java runs on Judge0 language_id 91 (JDK 17.0.6). */
const CODE_LANGUAGES: { code: CodeLanguage; label: string }[] = [
  { code: 'javascript', label: 'JavaScript' },
  { code: 'python', label: 'Python' },
  { code: 'java', label: 'Java' },
];

/** Group-level validator for the `languages` checkboxes group: at least one must be checked. */
function atLeastOneLanguageSelected(control: AbstractControl): ValidationErrors | null {
  const value = control.value as Record<string, boolean>;
  return Object.values(value).some(Boolean) ? null : { atLeastOneLanguage: true };
}

/** Dialog form to create a Question — fields shown depend on the chosen type (MULTIPLE_CHOICE vs CODE). */
@Component({
  selector: 'app-question-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './question-form.component.html',
  styleUrl: './question-form.component.scss',
})
export class QuestionForm {
  private readonly fb = inject(FormBuilder);
  private readonly questionService = inject(QuestionService);
  private readonly dialogRef = inject(MatDialogRef<QuestionForm>);

  readonly difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
  readonly categories = QUESTION_CATEGORIES;
  readonly codeLanguages = CODE_LANGUAGES;
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<QuestionType>('MULTIPLE_CHOICE', Validators.required),
    category: this.fb.nonNullable.control('', Validators.required),
    statement: this.fb.nonNullable.control('', Validators.required),
    difficulty: this.fb.nonNullable.control<Difficulty>('EASY', Validators.required),
    options: this.fb.array<ReturnType<typeof this.newOption>>([]),
    languages: this.fb.nonNullable.group({
      javascript: this.fb.nonNullable.control(false),
      python: this.fb.nonNullable.control(false),
      java: this.fb.nonNullable.control(false),
    }),
    functionName: this.fb.nonNullable.control(''),
    testCases: this.fb.array<ReturnType<typeof this.newTestCase>>([]),
  });

  /** No explicit return type: keep the FormArray<FormGroup<...>> generic the form group already infers, instead of widening to plain FormArray. */
  get optionsArray() {
    return this.form.controls.options;
  }

  get testCasesArray() {
    return this.form.controls.testCases;
  }

  constructor() {
    // Seed one empty test-case row so the CODE section starts usable instead of blank.
    this.addTestCase();

    // CODE-only required validators (functionName, languages, testCases) only apply
    // while type === 'CODE' — toggled here instead of declared upfront so switching
    // back to MULTIPLE_CHOICE doesn't leave the form permanently invalid.
    this.form.controls.type.valueChanges
      .pipe(startWith(this.form.controls.type.value))
      .subscribe((type) => this.applyCodeValidators(type === 'CODE'));
  }

  private applyCodeValidators(isCode: boolean): void {
    this.setValidators(this.form.controls.functionName, isCode ? [Validators.required] : []);
    this.setValidators(this.form.controls.languages, isCode ? [atLeastOneLanguageSelected] : []);
    this.setValidators(this.form.controls.testCases, isCode ? [Validators.minLength(1)] : []);
  }

  private setValidators(control: AbstractControl, validators: ValidatorFn[]): void {
    control.setValidators(validators.length ? validators : null);
    control.updateValueAndValidity({ emitEvent: false });
  }

  private newOption() {
    return this.fb.nonNullable.group({
      text: this.fb.nonNullable.control('', Validators.required),
      isCorrect: this.fb.nonNullable.control(false),
    });
  }

  addOption(): void {
    this.optionsArray.push(this.newOption());
  }

  removeOption(index: number): void {
    this.optionsArray.removeAt(index);
  }

  private newTestCase() {
    return this.fb.nonNullable.group({
      input: this.fb.nonNullable.control('', Validators.required),
      output: this.fb.nonNullable.control('', Validators.required),
    });
  }

  addTestCase(): void {
    this.testCasesArray.push(this.newTestCase());
  }

  removeTestCase(index: number): void {
    this.testCasesArray.removeAt(index);
  }

  /** Parses a free-text test-case field into JSON (numbers, arrays, booleans, objects, ...); falls back to the raw string as-typed when it isn't valid JSON. */
  private parseTestValue(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const isCode = value.type === 'CODE';
    const selectedLanguages = isCode ? this.codeLanguages.filter((lang) => value.languages[lang.code]) : [];
    this.saving.set(true);
    this.questionService
      .createQuestion({
        type: value.type,
        category: value.category,
        statement: value.statement,
        difficulty: value.difficulty,
        options: value.type === 'MULTIPLE_CHOICE' ? value.options : undefined,
        allowedLanguages: isCode ? selectedLanguages.map((lang) => lang.code) : undefined,
        functionName: isCode ? value.functionName : undefined,
        testCases: isCode
          ? value.testCases.map(
              (testCase): TestCase => ({
                input: this.parseTestValue(testCase.input),
                output: this.parseTestValue(testCase.output),
              }),
            )
          : undefined,
      })
      .subscribe({
        next: (question: Question) => {
          this.saving.set(false);
          this.dialogRef.close(question);
        },
        error: () => this.saving.set(false),
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
