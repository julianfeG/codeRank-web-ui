import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';

import { QuestionForm } from './question-form.component';

describe('QuestionForm', () => {
  let component: QuestionForm;
  let fixture: ComponentFixture<QuestionForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionForm],
      providers: [provideHttpClient(), { provide: MatDialogRef, useValue: { close: () => {} } }],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
