import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CreateQuestionPayload } from '../../shared/models';
import { QuestionService } from './question.service';

describe('QuestionService', () => {
  let service: QuestionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(QuestionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getQuestions() with no filters GETs /questions with no query params', () => {
    service.getQuestions().subscribe();

    const req = httpMock.expectOne((r) => r.url === '/questions');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('getQuestions() sets category and difficulty as query params when both given', () => {
    service.getQuestions({ category: 'Algorithms', difficulty: 'EASY' }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === '/questions' && r.params.get('category') === 'Algorithms' && r.params.get('difficulty') === 'EASY',
    );
    req.flush([]);
  });

  it('getQuestions() only sets the params that were actually given', () => {
    service.getQuestions({ category: 'SQL' }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/questions');
    expect(req.request.params.get('category')).toBe('SQL');
    expect(req.request.params.has('difficulty')).toBe(false);
    req.flush([]);
  });

  it('getQuestion(id) GETs /questions/:id', () => {
    service.getQuestion('q1').subscribe();

    const req = httpMock.expectOne('/questions/q1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('createQuestion(payload) POSTs to /questions with the payload', () => {
    const payload: CreateQuestionPayload = {
      category: 'Algorithms',
      difficulty: 'EASY',
      type: 'MULTIPLE_CHOICE',
      statement: '¿Cuál es la salida?',
      options: [{ text: 'A', isCorrect: true }],
    };

    service.createQuestion(payload).subscribe();

    const req = httpMock.expectOne('/questions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });
});
