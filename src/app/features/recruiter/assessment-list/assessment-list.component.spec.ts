import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { AssessmentList } from './assessment-list.component';

describe('AssessmentList', () => {
  let component: AssessmentList;
  let fixture: ComponentFixture<AssessmentList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentList],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
