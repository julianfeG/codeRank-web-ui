import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AssessmentDetail,
  AssessmentSummary,
  CreateAssessmentPayload,
  SubmissionSummary,
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AssessmentService {
  private readonly http = inject(HttpClient);

  getAssessments(): Observable<AssessmentSummary[]> {
    return this.http.get<AssessmentSummary[]>('/assessments');
  }

  getAssessment(id: string): Observable<AssessmentDetail> {
    return this.http.get<AssessmentDetail>(`/assessments/${id}`);
  }

  createAssessment(payload: CreateAssessmentPayload): Observable<AssessmentDetail> {
    return this.http.post<AssessmentDetail>('/assessments', payload);
  }

  getSubmissions(assessmentId: string): Observable<SubmissionSummary[]> {
    return this.http.get<SubmissionSummary[]>(`/assessments/${assessmentId}/submissions`);
  }

  deleteAssessment(id: string): Observable<void> {
    return this.http.delete<void>(`/assessments/${id}`);
  }
}
