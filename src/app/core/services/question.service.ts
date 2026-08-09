import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateQuestionPayload, Difficulty, Question } from '../../shared/models';

/** Optional query filters for GET /questions — both combinable, both omitted means no filtering. */
export interface QuestionFilters {
  category?: string;
  difficulty?: Difficulty;
}

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly http = inject(HttpClient);

  getQuestions(filters?: QuestionFilters): Observable<Question[]> {
    let params = new HttpParams();
    if (filters?.category) {
      params = params.set('category', filters.category);
    }
    if (filters?.difficulty) {
      params = params.set('difficulty', filters.difficulty);
    }
    return this.http.get<Question[]>('/questions', { params });
  }

  getQuestion(id: string): Observable<Question> {
    return this.http.get<Question>(`/questions/${id}`);
  }

  createQuestion(payload: CreateQuestionPayload): Observable<Question> {
    return this.http.post<Question>('/questions', payload);
  }
}
