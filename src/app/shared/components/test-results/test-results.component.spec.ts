import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestResultsView } from './test-results.component';

describe('TestResultsView', () => {
  let component: TestResultsView;
  let fixture: ComponentFixture<TestResultsView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestResultsView],
    }).compileComponents();

    fixture = TestBed.createComponent(TestResultsView);
    fixture.componentRef.setInput('testResults', [
      { input: 1, expectedOutput: 2, actualOutput: 2, passed: true },
      { input: 2, expectedOutput: 4, actualOutput: 3, passed: false, error: 'Wrong output' },
    ]);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('computes the passed/total summary from the array', () => {
    expect(component.passedCount()).toBe(1);
    expect(component.totalCount()).toBe(2);
  });
});
