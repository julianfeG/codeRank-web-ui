import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { AssessmentSubmissions } from './assessment-submissions.component';

describe('AssessmentSubmissions', () => {
  let component: AssessmentSubmissions;
  let fixture: ComponentFixture<AssessmentSubmissions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentSubmissions],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentSubmissions);
    fixture.componentRef.setInput('assessmentId', 'test-assessment-id');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
