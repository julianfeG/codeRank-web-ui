import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CreateAssessmentPayload } from '../../shared/models';
import { AssessmentService } from './assessment.service';

describe('AssessmentService', () => {
  let service: AssessmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AssessmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAssessments() GETs /assessments', () => {
    service.getAssessments().subscribe();

    const req = httpMock.expectOne('/assessments');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getAssessment(id) GETs /assessments/:id', () => {
    service.getAssessment('a1').subscribe();

    const req = httpMock.expectOne('/assessments/a1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('createAssessment(payload) POSTs to /assessments with the payload', () => {
    const payload: CreateAssessmentPayload = {
      title: 'Kata Fullstack',
      description: 'Una descripción',
      questionIds: ['q1', 'q2'],
    };

    service.createAssessment(payload).subscribe();

    const req = httpMock.expectOne('/assessments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('getSubmissions(assessmentId) GETs /assessments/:id/submissions', () => {
    service.getSubmissions('a1').subscribe();

    const req = httpMock.expectOne('/assessments/a1/submissions');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('deleteAssessment(id) DELETEs /assessments/:id', () => {
    service.deleteAssessment('a1').subscribe();

    const req = httpMock.expectOne('/assessments/a1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
