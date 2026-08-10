import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AssessmentService } from '../../core/services/assessment.service';
import { SubmissionService } from '../../core/services/submission.service';
import { EmbeddedQuestion, EmbeddedQuestionOption, SubmissionAnswer, SubmissionResult } from '../models';
import { TestResultsView } from '../components/test-results/test-results.component';

/** One graded answer paired with the question it answers, once the assessment has loaded. */
interface AnswerRow {
  answer: SubmissionAnswer;
  question: EmbeddedQuestion | undefined;
}

/** One falling piece of confetti, laid out once at construction (not re-randomized on every change-detection pass). */
interface ConfettiPiece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
}

const CONFETTI_COLORS = ['#2cbe4c', '#facc15', '#38bdf8', '#f472b6', '#fb923c'];

/**
 * Neutral result screen — mounted both from the candidate's own flow
 * (/candidate/submissions/:submissionId/results) and from the recruiter
 * clicking a candidate row (/recruiter/assessments/:assessmentId/submissions/:submissionId).
 *
 * GET /submissions/:id (submissionService.getSubmission) only carries the graded
 * answers, not the question text/options — those live on GET /assessments/:id, so
 * this also fetches the assessment to show each statement and, for MULTIPLE_CHOICE,
 * which option was correct alongside what the candidate picked.
 */
@Component({
  selector: 'app-submission-result',
  imports: [MatCardModule, MatChipsModule, MatIconModule, TestResultsView],
  templateUrl: './submission-result.component.html',
  styleUrl: './submission-result.component.scss',
})
export class SubmissionResultView {
  private readonly submissionService = inject(SubmissionService);
  private readonly assessmentService = inject(AssessmentService);
  private readonly analytics = inject(AnalyticsService);
  private readonly router = inject(Router);

  /** Bound automatically from the :submissionId route param (withComponentInputBinding). */
  readonly submissionId = input.required<string>();

  readonly result = signal<SubmissionResult | null>(null);
  readonly questionsById = signal<Record<string, EmbeddedQuestion>>({});
  /** Question order (assessmentQuestions.order), by questionId — used to sort the answers below. */
  readonly orderById = signal<Record<string, number>>({});
  readonly loading = signal(false);

  /**
   * The pass/fail banner ("felicidades" / "gracias por participar") only
   * makes sense addressed to the candidate — a recruiter reviewing the same
   * screen doesn't need to be told "te contactaremos". Both routes mount this
   * same component, so this is the only thing that tells them apart; it's
   * read once since the route audience can't change without recreating the
   * component (the URL is only ever /candidate/... or /recruiter/...).
   */
  readonly isCandidateView = this.router.url.startsWith('/candidate');

  /** Laid out once — not regenerated on every change-detection pass, which would make the confetti jump around instead of falling. */
  readonly confettiPieces: ConfettiPiece[] = Array.from({ length: 40 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2.4 + Math.random() * 1.6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotate: Math.random() * 360,
  }));

  /** Each answer paired with its question and sorted into the assessment's original order, instead of whatever order the API happened to return answers in. */
  readonly rows = computed<AnswerRow[]>(() => {
    const res = this.result();
    if (!res) {
      return [];
    }
    const questions = this.questionsById();
    const order = this.orderById();
    return [...res.answers]
      .sort((a, b) => (order[a.questionId] ?? 0) - (order[b.questionId] ?? 0))
      .map((answer) => ({ answer, question: questions[answer.questionId] }));
  });

  constructor() {
    effect(() => {
      const id = this.submissionId();
      this.loading.set(true);
      this.submissionService.getSubmission(id).subscribe({
        next: (result) => {
          this.result.set(result);
          if (this.isCandidateView) {
            // "Envío" (closing event): the candidate is looking at their own
            // outcome. Rounds out the funnel started by assessment_start_view.
            this.analytics.trackEvent('assessment_result_viewed', {
              submission_id: id,
              passed: this.passed(result),
              score_percent: this.passPercent(result),
            });
          }
          this.assessmentService.getAssessment(result.submission.assessmentId).subscribe({
            next: (assessment) => {
              this.questionsById.set(
                Object.fromEntries(assessment.assessmentQuestions.map((aq) => [aq.questionId, aq.question])),
              );
              this.orderById.set(
                Object.fromEntries(assessment.assessmentQuestions.map((aq) => [aq.questionId, aq.order])),
              );
              this.loading.set(false);
            },
            // The graded answers still render without the assessment (just minus
            // the statement/options), so a failure here isn't fatal to the page.
            error: () => this.loading.set(false),
          });
        },
        error: () => this.loading.set(false),
      });
    });
  }

  /** Which icon a MULTIPLE_CHOICE option gets: the correct one always shows a check, whatever the candidate actually clicked (if wrong) shows an X, everything else is a plain unchecked circle. */
  optionIcon(option: EmbeddedQuestionOption, selectedOptionId: string | null): string {
    if (option.isCorrect) {
      return 'check_circle';
    }
    return option.id === selectedOptionId ? 'cancel' : 'radio_button_unchecked';
  }

  /** Overall pass rate as a whole-number percentage. maxScore is 0 for an assessment with no scored questions yet — 0% rather than NaN in that edge case. */
  passPercent(result: SubmissionResult): number {
    if (result.maxScore <= 0) {
      return 0;
    }
    return Math.round((result.totalScore / result.maxScore) * 100);
  }

  /** Same bar the recruiter's candidates table uses (see AssessmentSubmissions.passed) — kept in sync via the same environment.passingScorePercent rather than a second hardcoded number. */
  passed(result: SubmissionResult): boolean {
    return result.submission.status === 'SUBMITTED' && this.passPercent(result) >= environment.passingScorePercent;
  }
}
