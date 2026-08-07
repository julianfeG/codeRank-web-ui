import { Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { Difficulty } from '../../models';

@Component({
  selector: 'app-difficulty-badge',
  imports: [MatChipsModule],
  templateUrl: './difficulty-badge.component.html',
  styleUrl: './difficulty-badge.component.scss',
})
export class DifficultyBadge {
  readonly difficulty = input.required<Difficulty>();
}
