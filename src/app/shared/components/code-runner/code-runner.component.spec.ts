import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { SubmissionService } from '../../../core/services/submission.service';
import { SubmissionAnswer } from '../../models';
import { CodeRunner } from './code-runner.component';

const savedAnswer: SubmissionAnswer = {
  id: 'ans1',
  questionId: 'q1',
  selectedOptionId: null,
  submittedCode: 'function reverseString(s) { return s; }',
  language: 'javascript',
  testResults: [{ input: 'hello', expectedOutput: 'olleh', actualOutput: 'hello', passed: false }],
  passed: false,
  score: 0,
};

describe('CodeRunner', () => {
  let fixture: ComponentFixture<CodeRunner>;
  let saveAnswer: ReturnType<typeof vi.fn>;
  let runCode: ReturnType<typeof vi.fn>;

  interface Inputs {
    allowedLanguages?: string[];
    starterCodeTemplates?: Record<string, string> | null;
    savedAnswer?: SubmissionAnswer | null;
  }

  async function createFixture(inputs: Inputs = {}): Promise<CodeRunner> {
    await TestBed.configureTestingModule({
      imports: [CodeRunner],
      providers: [
        provideHttpClient(),
        provideMonacoEditor(),
        { provide: SubmissionService, useValue: { saveAnswer, runCode } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeRunner);
    fixture.componentRef.setInput('submissionId', 'sub1');
    fixture.componentRef.setInput('questionId', 'q1');
    fixture.componentRef.setInput('allowedLanguages', inputs.allowedLanguages ?? ['javascript', 'python']);
    fixture.componentRef.setInput(
      'starterCodeTemplates',
      inputs.starterCodeTemplates ?? { javascript: '// js starter', python: '# python starter' },
    );
    if (inputs.savedAnswer !== undefined) {
      fixture.componentRef.setInput('savedAnswer', inputs.savedAnswer);
    }
    await fixture.whenStable();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    saveAnswer = vi.fn().mockReturnValue(of({} as SubmissionAnswer));
    runCode = vi.fn().mockReturnValue(of({} as SubmissionAnswer));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults selectedLanguage to the first allowed language with no saved answer', async () => {
    const component = await createFixture();
    expect(component.selectedLanguage()).toBe('javascript');
    expect(component.runDisabled()).toBe(false);
  });

  it('loads the starter template for the default language when there is no saved answer', async () => {
    const component = await createFixture();
    expect(component.code()).toBe('// js starter');
  });

  it("prefers the saved answer's language over the first allowed one", async () => {
    const component = await createFixture({ savedAnswer });

    expect(component.selectedLanguage()).toBe('javascript'); // savedAnswer.language
    expect(component.code()).toBe(savedAnswer.submittedCode);
  });

  it('an explicit selectLanguage() call wins over everything else', async () => {
    const component = await createFixture({ savedAnswer });

    component.selectLanguage('python');
    await fixture.whenStable();

    expect(component.selectedLanguage()).toBe('python');
    // saved answer is for javascript, doesn't match python, so it falls back to the starter template
    expect(component.code()).toBe('# python starter');
  });

  it('shows the saved test results once, before anything has been run in this session', async () => {
    const component = await createFixture({ allowedLanguages: ['javascript'], savedAnswer });

    expect(component.result()).toEqual(savedAnswer);
  });

  it('languageLabel maps known codes and falls back to the raw code', async () => {
    const component = await createFixture();
    expect(component.languageLabel('javascript')).toBe('JavaScript');
    expect(component.languageLabel('java')).toBe('Java');
    expect(component.languageLabel('rust')).toBe('rust');
  });

  it('onCodeChange updates the code signal immediately', async () => {
    const component = await createFixture();
    component.onCodeChange('const x = 1;');
    expect(component.code()).toBe('const x = 1;');
  });

  it('auto-saves after the candidate stops typing for codeAutoSaveIdleMs', async () => {
    const component = await createFixture();
    vi.useFakeTimers();

    component.onCodeChange('const x = 1;');
    expect(saveAnswer).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(environment.codeAutoSaveIdleMs);

    expect(saveAnswer).toHaveBeenCalledWith('sub1', {
      questionId: 'q1',
      submittedCode: 'const x = 1;',
      language: 'javascript',
    });
  });

  it('does not auto-save before the idle delay elapses', async () => {
    const component = await createFixture();
    vi.useFakeTimers();

    component.onCodeChange('const x = 1;');
    await vi.advanceTimersByTimeAsync(environment.codeAutoSaveIdleMs - 500);

    expect(saveAnswer).not.toHaveBeenCalled();
  });

  it('run() saves then runs the code, and stores the result', async () => {
    const component = await createFixture();
    const result: SubmissionAnswer = { ...savedAnswer, testResults: [] };
    runCode.mockReturnValue(of(result));

    component.run();
    await fixture.whenStable();

    expect(saveAnswer).toHaveBeenCalledWith('sub1', {
      questionId: 'q1',
      submittedCode: component.code(),
      language: 'javascript',
    });
    expect(runCode).toHaveBeenCalledWith('sub1', { questionId: 'q1' });
    expect(component.result()).toEqual(result);
    expect(component.running()).toBe(false);
  });

  it('run() does nothing when there is no selected language', async () => {
    const component = await createFixture({ allowedLanguages: [], starterCodeTemplates: null });

    component.run();

    expect(runCode).not.toHaveBeenCalled();
  });
});
