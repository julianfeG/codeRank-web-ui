import { Component, computed, input } from '@angular/core';
import { TestResult } from '../../models';

/**
 * Renders a CODE answer's graded test cases: an aggregate "X/Y pasaron" summary
 * computed from the array (there's no separate score field to read here), plus
 * a preview of the *first* test case's expected/actual output. Deliberately
 * never shows the rest of the suite — this is shared between app-code-runner
 * (while the candidate is still solving, so the full suite can't be read as an
 * answer key) and the submission-result screen (after grading, kept to the
 * same minimal view for consistency rather than dumping the whole suite there
 * instead).
 *
 * Grading errors (TestResult.error — a compile/runtime error from actually
 * running the candidate's code) are the one exception: hidden by default
 * everywhere, but app-code-runner opts in via [showErrors]="true" so the
 * candidate gets something to debug from while solving. resolve-assessment is
 * its only consumer, so that's also the only screen where errors ever show —
 * submission-result never passes the input, so recruiters keep seeing the
 * plain pass/fail summary they already do. Only the *first* case's error
 * ever shows, matching the Esperado/Obtenido preview's own first-case-only
 * scope — see firstCaseError below.
 */
@Component({
  selector: 'app-test-results',
  imports: [],
  templateUrl: './test-results.component.html',
  styleUrl: './test-results.component.scss',
})
export class TestResultsView {
  readonly testResults = input.required<TestResult[]>();
  readonly showErrors = input(false);

  readonly totalCount = computed(() => this.testResults().length);
  readonly passedCount = computed(() => this.testResults().filter((t) => t.passed).length);
  readonly firstCase = computed(() => this.testResults()[0] ?? null);
  /**
   * The first case's own grading error, if it failed with one — only ever
   * read when showErrors() is true. Deliberately just the first case (same
   * scope as the Esperado/Obtenido preview above it), not every failing
   * case's error: later cases are often the same root cause repeated, and
   * piling on N copies of the same stack trace was noise more than help.
   */
  readonly firstCaseError = computed(() => {
    const first = this.firstCase();
    return first && !first.passed ? (first.error ?? null) : null;
  });

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
