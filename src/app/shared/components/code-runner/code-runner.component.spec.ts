import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';

import { CodeRunner } from './code-runner.component';

describe('CodeRunner', () => {
  let component: CodeRunner;
  let fixture: ComponentFixture<CodeRunner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeRunner],
      providers: [provideHttpClient(), provideMonacoEditor()],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeRunner);
    fixture.componentRef.setInput('submissionId', 'test-submission-id');
    fixture.componentRef.setInput('questionId', 'test-question-id');
    fixture.componentRef.setInput('allowedLanguages', ['javascript', 'python']);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
