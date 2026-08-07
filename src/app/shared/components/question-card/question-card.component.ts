import { Component, computed, input, model } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { DifficultyBadge } from '../difficulty-badge/difficulty-badge.component';
import { Question } from '../../models';

@Component({
  selector: 'app-question-card',
  imports: [MatCheckboxModule, MatIconModule, DifficultyBadge],
  templateUrl: './question-card.component.html',
  styleUrl: './question-card.component.scss',
})
export class QuestionCard {
  readonly question = input.required<Question>();
  /** Whether to render the selection checkbox (used in create-assessment). */
  readonly selectable = input(false);
  /** Two-way bindable checked state, only relevant when selectable(). */
  readonly selected = model(false);

  readonly typeIcon = computed(() => (this.question().type === 'CODE' ? 'code' : 'checklist'));
}
