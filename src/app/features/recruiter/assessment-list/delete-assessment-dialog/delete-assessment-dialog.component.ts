import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AssessmentSummary } from '../../../../shared/models';

export interface DeleteAssessmentDialogData {
  assessment: AssessmentSummary;
}

/**
 * Confirmation dialog opened before deleting an assessment. Spells out that
 * the action is irreversible and, when the assessment already has
 * submissions, surfaces the exact candidate count so the recruiter can't
 * miss what's at stake.
 */
@Component({
  selector: 'app-delete-assessment-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './delete-assessment-dialog.component.html',
  styleUrl: './delete-assessment-dialog.component.scss',
})
export class DeleteAssessmentDialog {
  private readonly dialogRef = inject(MatDialogRef<DeleteAssessmentDialog>);
  readonly data = inject<DeleteAssessmentDialogData>(MAT_DIALOG_DATA);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
