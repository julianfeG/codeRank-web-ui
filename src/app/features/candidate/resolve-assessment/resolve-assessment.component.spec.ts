import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';

import { ResolveAssessment } from './resolve-assessment.component';

describe('ResolveAssessment', () => {
  let component: ResolveAssessment;
  let fixture: ComponentFixture<ResolveAssessment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolveAssessment],
      providers: [provideHttpClient(), provideRouter([]), provideMonacoEditor()],
    }).compileComponents();

    fixture = TestBed.createComponent(ResolveAssessment);
    fixture.componentRef.setInput('submissionId', 'test-submission-id');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
