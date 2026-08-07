import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { CreateAssessment } from './create-assessment.component';

describe('CreateAssessment', () => {
  let component: CreateAssessment;
  let fixture: ComponentFixture<CreateAssessment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAssessment],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAssessment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
