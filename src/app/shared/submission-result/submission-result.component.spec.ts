import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { SubmissionResultView } from './submission-result.component';

describe('SubmissionResultView', () => {
  let component: SubmissionResultView;
  let fixture: ComponentFixture<SubmissionResultView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionResultView],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmissionResultView);
    fixture.componentRef.setInput('submissionId', 'test-submission-id');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
