import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionCard } from './question-card.component';
import { Question } from '../../models';

const testQuestion: Question = {
  id: 'q1',
  category: 'Algorithms',
  type: 'MULTIPLE_CHOICE',
  statement: 'Sample question?',
  difficulty: 'EASY',
  starterCode: null,
  expectedOutput: null,
  options: [],
};

describe('QuestionCard', () => {
  let component: QuestionCard;
  let fixture: ComponentFixture<QuestionCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionCard],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionCard);
    fixture.componentRef.setInput('question', testQuestion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
