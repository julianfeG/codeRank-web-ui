import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { TestResult } from '../../models';
import { TestResultsView } from './test-results.component';

describe('TestResultsView', () => {
  let component: TestResultsView;
  let fixture: ComponentFixture<TestResultsView>;

  async function createFixture(testResults: TestResult[], showErrors = false): Promise<void> {
    await TestBed.configureTestingModule({ imports: [TestResultsView] }).compileComponents();
    fixture = TestBed.createComponent(TestResultsView);
    fixture.componentRef.setInput('testResults', testResults);
    fixture.componentRef.setInput('showErrors', showErrors);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  it('totalCount/passedCount count the full suite and the passing ones', async () => {
    await createFixture([
      { input: 1, expectedOutput: 1, actualOutput: 1, passed: true },
      { input: 2, expectedOutput: 4, actualOutput: 3, passed: false },
      { input: 3, expectedOutput: 9, actualOutput: 9, passed: true },
    ]);

    expect(component.totalCount()).toBe(3);
    expect(component.passedCount()).toBe(2);
  });

  it('firstCase is the first element of the suite', async () => {
    const first: TestResult = { input: 1, expectedOutput: 1, actualOutput: 1, passed: true };
    await createFixture([first, { input: 2, expectedOutput: 2, actualOutput: 2, passed: true }]);

    expect(component.firstCase()).toEqual(first);
  });

  it('firstCase is null for an empty suite', async () => {
    await createFixture([]);
    expect(component.firstCase()).toBeNull();
  });

  it('does not render the error block when showErrors is false, even if the first case failed with an error', async () => {
    await createFixture(
      [{ input: 1, expectedOutput: 1, actualOutput: null, passed: false, error: 'boom' }],
      false,
    );
    // firstCaseError() itself doesn't gate on showErrors — that's the template's job
    // (see the @if in test-results.component.html) — so this checks the rendered DOM.
    expect(component.firstCaseError()).toBe('boom');
    expect(fixture.nativeElement.querySelector('.errors-section')).toBeNull();
  });

  it('renders the error block when showErrors is true and the first case failed with an error', async () => {
    await createFixture(
      [{ input: 1, expectedOutput: 1, actualOutput: null, passed: false, error: 'boom' }],
      true,
    );
    const errorBlock = fixture.nativeElement.querySelector('.errors-section');
    expect(errorBlock).not.toBeNull();
    expect(errorBlock.textContent).toContain('boom');
  });

  it('firstCaseError is null when the first case passed', async () => {
    await createFixture([{ input: 1, expectedOutput: 1, actualOutput: 1, passed: true }], true);
    expect(component.firstCaseError()).toBeNull();
  });

  it('firstCaseError is null when the first case failed but carries no error message', async () => {
    await createFixture([{ input: 1, expectedOutput: 1, actualOutput: 2, passed: false }], true);
    expect(component.firstCaseError()).toBeNull();
  });

  it('firstCaseError surfaces the error only from the first case, not later failing cases', async () => {
    await createFixture(
      [
        { input: 1, expectedOutput: 1, actualOutput: null, passed: false, error: 'first error' },
        { input: 2, expectedOutput: 2, actualOutput: null, passed: false, error: 'second error' },
      ],
      true,
    );
    expect(component.firstCaseError()).toBe('first error');
  });

  it('formatValue renders strings as-typed and everything else as JSON', async () => {
    await createFixture([]);
    expect(component.formatValue('hello')).toBe('hello');
    expect(component.formatValue(42)).toBe('42');
    expect(component.formatValue(true)).toBe('true');
    expect(component.formatValue({ a: 1 })).toBe('{"a":1}');
    expect(component.formatValue([1, 2, 3])).toBe('[1,2,3]');
  });
});
