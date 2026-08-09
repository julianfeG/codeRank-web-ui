import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestionService } from '../../../core/services/question.service';
import { Question } from '../../models';
import { QuestionForm } from './question-form.component';

const createdQuestion = { id: 'q1' } as Question;

describe('QuestionForm', () => {
  let component: QuestionForm;
  let fixture: ComponentFixture<QuestionForm>;
  let createQuestion: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createQuestion = vi.fn().mockReturnValue(of(createdQuestion));
    close = vi.fn();

    await TestBed.configureTestingModule({
      imports: [QuestionForm],
      providers: [
        provideHttpClient(),
        { provide: QuestionService, useValue: { createQuestion } },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function fillCommonFields(): void {
    component.form.patchValue({ category: 'Algorithms', statement: 'Enunciado', difficulty: 'EASY' });
  }

  it('starts as MULTIPLE_CHOICE with one pre-seeded (non-required) test case row', () => {
    expect(component.form.controls.type.value).toBe('MULTIPLE_CHOICE');
    expect(component.testCasesArray.length).toBe(1);
    expect(component.testCasesArray.at(0).valid).toBe(true);
  });

  it('canSubmit is false with the form empty (no options yet either)', () => {
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit stays false for MULTIPLE_CHOICE with no options at all', () => {
    fillCommonFields();
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit stays false for MULTIPLE_CHOICE with options but none marked correct', () => {
    fillCommonFields();
    component.addOption();
    component.optionsArray.at(0).patchValue({ text: 'A' });

    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit is true for MULTIPLE_CHOICE once one option is filled and marked correct', () => {
    fillCommonFields();
    component.addOption();
    component.optionsArray.at(0).patchValue({ text: 'A', isCorrect: true });

    expect(component.canSubmit()).toBe(true);
  });

  it('addOption/removeOption grow and shrink the options array', () => {
    component.addOption();
    component.addOption();
    expect(component.optionsArray.length).toBe(2);

    component.removeOption(0);
    expect(component.optionsArray.length).toBe(1);
  });

  it('switching to CODE clears the MULTIPLE_CHOICE-only options requirement', () => {
    fillCommonFields();
    component.form.controls.type.setValue('CODE');

    expect(component.optionsArray.errors).toBeNull();
  });

  it('switching to CODE requires functionName, at least one language, and each test case row', () => {
    fillCommonFields();
    component.form.controls.type.setValue('CODE');

    expect(component.canSubmit()).toBe(false);

    component.form.patchValue({ functionName: 'reverseString' });
    expect(component.canSubmit()).toBe(false); // still no language, empty seeded test case row

    component.form.controls.languages.patchValue({ javascript: true });
    expect(component.canSubmit()).toBe(false); // seeded test case row is required now, still empty

    component.testCasesArray.at(0).patchValue({ input: '"hello"', output: '"olleh"' });
    expect(component.canSubmit()).toBe(true);
  });

  it('switching back to MULTIPLE_CHOICE clears the now-irrelevant CODE requirements', () => {
    fillCommonFields();
    component.form.controls.type.setValue('CODE');
    component.form.controls.type.setValue('MULTIPLE_CHOICE');

    expect(component.form.controls.functionName.errors).toBeNull();
    expect(component.form.controls.languages.errors).toBeNull();
    expect(component.testCasesArray.at(0).controls.input.errors).toBeNull();
  });

  it('addTestCase/removeTestCase grow and shrink the test cases array', () => {
    component.addTestCase();
    expect(component.testCasesArray.length).toBe(2);

    component.removeTestCase(0);
    expect(component.testCasesArray.length).toBe(1);
  });

  it('submit() does nothing and marks the form touched when invalid', () => {
    component.submit();

    expect(createQuestion).not.toHaveBeenCalled();
    expect(component.form.controls.category.touched).toBe(true);
  });

  it('submit() for MULTIPLE_CHOICE sends the options and omits CODE-only fields', () => {
    fillCommonFields();
    component.addOption();
    component.optionsArray.at(0).patchValue({ text: 'A', isCorrect: true });

    component.submit();

    expect(createQuestion).toHaveBeenCalledWith({
      type: 'MULTIPLE_CHOICE',
      category: 'Algorithms',
      statement: 'Enunciado',
      difficulty: 'EASY',
      options: [{ text: 'A', isCorrect: true }],
      allowedLanguages: undefined,
      functionName: undefined,
      testCases: undefined,
    });
  });

  it('submit() for CODE sends only the checked languages and parsed test case values', () => {
    fillCommonFields();
    component.form.controls.type.setValue('CODE');
    component.form.patchValue({ functionName: 'reverseString' });
    component.form.controls.languages.patchValue({ javascript: true, python: true, java: false });
    component.testCasesArray.at(0).patchValue({ input: '"hello"', output: '"olleh"' });

    component.submit();

    expect(createQuestion).toHaveBeenCalledWith({
      type: 'CODE',
      category: 'Algorithms',
      statement: 'Enunciado',
      difficulty: 'EASY',
      options: undefined,
      allowedLanguages: ['javascript', 'python'],
      functionName: 'reverseString',
      testCases: [{ input: 'hello', output: 'olleh' }],
    });
  });

  it('parses non-JSON test case text as the raw string instead of throwing', () => {
    fillCommonFields();
    component.form.controls.type.setValue('CODE');
    component.form.patchValue({ functionName: 'greet' });
    component.form.controls.languages.patchValue({ javascript: true });
    component.testCasesArray.at(0).patchValue({ input: 'hello world', output: '42' });

    component.submit();

    expect(createQuestion).toHaveBeenCalledWith(
      expect.objectContaining({ testCases: [{ input: 'hello world', output: 42 }] }),
    );
  });

  it('closes the dialog with the created question on success', () => {
    fillCommonFields();
    component.addOption();
    component.optionsArray.at(0).patchValue({ text: 'A', isCorrect: true });

    component.submit();

    expect(close).toHaveBeenCalledWith(createdQuestion);
    expect(component.saving()).toBe(false);
  });

  it('cancel() closes the dialog with no value', () => {
    component.cancel();
    expect(close).toHaveBeenCalledWith();
  });
});
