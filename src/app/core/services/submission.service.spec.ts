import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CreateSubmissionPayload, SaveCodeAnswerPayload } from '../../shared/models';
import { SubmissionService } from './submission.service';

describe('SubmissionService', () => {
  let service: SubmissionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SubmissionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('createSubmission(payload) POSTs to /submissions', () => {
    const payload: CreateSubmissionPayload = {
      assessmentId: 'a1',
      candidateName: 'Ana',
      candidateEmail: 'ana@test.com',
    };

    service.createSubmission(payload).subscribe();

    const req = httpMock.expectOne('/submissions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('saveAnswer(submissionId, payload) POSTs to /submissions/:id/answers', () => {
    const payload: SaveCodeAnswerPayload = { questionId: 'q1', submittedCode: 'code', language: 'javascript' };

    service.saveAnswer('s1', payload).subscribe();

    const req = httpMock.expectOne('/submissions/s1/answers');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('runCode(submissionId, payload) POSTs to /submissions/:id/run-code', () => {
    service.runCode('s1', { questionId: 'q1' }).subscribe();

    const req = httpMock.expectOne('/submissions/s1/run-code');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ questionId: 'q1' });
    req.flush({});
  });

  it('submit(submissionId) POSTs to /submissions/:id/submit', () => {
    service.submit('s1').subscribe();

    const req = httpMock.expectOne('/submissions/s1/submit');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('getSubmission(id) GETs /submissions/:id', () => {
    service.getSubmission('s1').subscribe();

    const req = httpMock.expectOne('/submissions/s1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
