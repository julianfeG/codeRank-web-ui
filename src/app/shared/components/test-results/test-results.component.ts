import { Component, computed, input } from '@angular/core';
import { TestResult } from '../../models';

/**
 * Renders a CODE answer's graded test cases: an aggregate "X/Y pasaron" summary
 * computed from the array (there's no separate score field to read here), plus
 * a preview of the *first* test case's expected/actual output. Deliberately
 * never shows the rest of the suite or any grading error — this is shared
 * between app-code-runner (while the candidate is still solving, so the full
 * suite and its error messages can't be read as an answer key) and the
 * submission-result screen (after grading, kept to the same minimal view for
 * consistency rather than dumping the whole suite there instead).
 */
@Component({
  selector: 'app-test-results',
  imports: [],
  templateUrl: './test-results.component.html',
  styleUrl: './test-results.component.scss',
})
export class TestResultsView {
  readonly testResults = input.required<TestResult[]>();

  readonly totalCount = computed(() => this.testResults().length);
  readonly passedCount = computed(() => this.testResults().filter((t) => t.passed).length);
  readonly firstCase = computed(() => this.testResults()[0] ?? null);

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
}
