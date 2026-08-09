import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { QuestionBank } from './question-bank.component';

describe('QuestionBank', () => {
  let component: QuestionBank;
  let fixture: ComponentFixture<QuestionBank>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionBank],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionBank);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
