import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TestResult } from '../../models';

/**
 * Renders a CODE answer's graded test cases — one row per TestResult with its
 * input/expected/actual and a passed/failed icon, plus an aggregate "X/Y pasaron"
 * summary computed from the array (there's no separate score field to read here).
 * Shared between app-code-runner (right after a run) and the submission-result screen.
 */
@Component({
  selector: 'app-test-results',
  imports: [MatIconModule],
  templateUrl: './test-results.component.html',
  styleUrl: './test-results.component.scss',
})
export class TestResultsView {
  readonly testResults = input.required<TestResult[]>();

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
