import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { vi } from 'vitest';
import { DeleteAssessmentDialog } from './delete-assessment-dialog.component';
import { AssessmentSummary } from '../../../../shared/models';

describe('DeleteAssessmentDialog', () => {
  let component: DeleteAssessmentDialog;
  let fixture: ComponentFixture<DeleteAssessmentDialog>;
  let close: ReturnType<typeof vi.fn>;

  const assessment: AssessmentSummary = {
    id: 'a1',
    title: 'Assessment 1',
    description: '',
    createdAt: '2026-08-01T00:00:00.000Z',
    questionCount: 5,
    submissionCount: 3,
  };

  beforeEach(async () => {
    close = vi.fn();

    await TestBed.configureTestingModule({
      imports: [DeleteAssessmentDialog],
      providers: [
        { provide: MatDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useValue: { assessment } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteAssessmentDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('closes with false on cancel', () => {
    component.cancel();
    expect(close).toHaveBeenCalledWith(false);
  });

  it('closes with true on confirm', () => {
    component.confirm();
    expect(close).toHaveBeenCalledWith(true);
  });
});
