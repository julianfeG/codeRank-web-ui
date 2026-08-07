import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateSubmissionPayload,
  RunCodePayload,
  SaveAnswerPayload,
  Submission,
  SubmissionAnswer,
  SubmissionResult,
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class SubmissionService {
  private readonly http = inject(HttpClient);

  createSubmission(payload: CreateSubmissionPayload): Observable<Submission> {
    return this.http.post<Submission>('/submissions', payload);
  }

  /** Upserts the answer for payload.questionId. */
  saveAnswer(submissionId: string, payload: SaveAnswerPayload): Observable<SubmissionAnswer> {
    return this.http.post<SubmissionAnswer>(`/submissions/${submissionId}/answers`, payload);
  }

  /** Requires an answer to already exist for questionId (see saveAnswer). */
  runCode(submissionId: string, payload: RunCodePayload): Observable<SubmissionAnswer> {
    return this.http.post<SubmissionAnswer>(`/submissions/${submissionId}/run-code`, payload);
  }

  submit(submissionId: string): Observable<Submission> {
    return this.http.post<Submission>(`/submissions/${submissionId}/submit`, {});
  }

  getSubmission(id: string): Observable<SubmissionResult> {
    return this.http.get<SubmissionResult>(`/submissions/${id}`);
  }
}
