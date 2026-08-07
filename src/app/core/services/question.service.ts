import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateQuestionPayload, Question } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly http = inject(HttpClient);

  getQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>('/questions');
  }

  getQuestion(id: string): Observable<Question> {
    return this.http.get<Question>(`/questions/${id}`);
  }

  createQuestion(payload: CreateQuestionPayload): Observable<Question> {
    return this.http.post<Question>('/questions', payload);
  }
}
