import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { StartSubmission } from './start-submission.component';

describe('StartSubmission', () => {
  let component: StartSubmission;
  let fixture: ComponentFixture<StartSubmission>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartSubmission],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StartSubmission);
    fixture.componentRef.setInput('assessmentId', 'test-assessment-id');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
