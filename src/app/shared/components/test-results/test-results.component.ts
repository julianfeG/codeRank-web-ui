import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TestResult } from '../../models';

/**
 * Renders a CODE answer's graded test cases: an aggregate "X/Y pasaron" summary
 * computed from the array (there's no separate score field to read here), plus
 * optionally one row per TestResult with its input/expected/actual and a
 * passed/failed icon. Shared between app-code-runner (right after a run — where
 * showDetails is off so the candidate can't read the test cases mid-attempt) and
 * the submission-result screen (full detail, once the assessment is over).
 */
@Component({
  selector: 'app-test-results',
  imports: [MatIconModule],
  templateUrl: './test-results.component.html',
  styleUrl: './test-results.component.scss',
})
export class TestResultsView {
  readonly testResults = input.required<TestResult[]>();
  /** Whether to render the per-case input/expected/actual rows below the summary. Off hides them (e.g. while the candidate is still solving, to avoid leaking test data). */
  readonly showDetails = input<boolean>(true);

  readonly totalCount = computed(() => this.testResults().length);
  readonly passedCount = computed(() => this.testResults().filter((t) => t.passed).length);

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
