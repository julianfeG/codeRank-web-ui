import { Difficulty, QuestionType } from './question.model';

/** Shapes verified against the live backend (http://localhost:3000/api) on 2026-08-07. */

/** Trimmed option as embedded inside GET /assessments/:id — no questionId back-reference. */
export interface EmbeddedQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * A question as embedded inside GET /assessments/:id's assessmentQuestions[].question.
 * Trimmed by the backend — no standalone `id` (the library id lives one level up,
 * on the wrapping AssessmentQuestionRef.questionId).
 */
export interface EmbeddedQuestion {
  category: string;
  difficulty: Difficulty;
  type: QuestionType;
  statement: string;
  /** Populated when type === 'CODE'. */
  allowedLanguages: string[];
  /**
   * Present (non-null) when type === 'CODE'. Keyed by language, e.g.
   * `{ javascript: "...", python: "..." }`.
   *
   * Deliberately trimmed by the backend: `functionName` and `testCases` are
   * grading internals and are never exposed to the candidate on this endpoint.
   */
  starterCodeTemplates: Record<string, string> | null;
  options: EmbeddedQuestionOption[];
}

/** One entry of AssessmentDetail.assessmentQuestions. */
export interface AssessmentQuestionRef {
  /** The question bank id this was copied from — use this (not an array index) to reference answers. */
  questionId: string;
  order: number;
  question: EmbeddedQuestion;
}

/** Row shape for the assessments list (GET /assessments). */
export interface AssessmentSummary {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  questionCount: number;
  submissionCount: number;
}

/** Full assessment as returned by GET /assessments/:id. */
export interface AssessmentDetail {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  assessmentQuestions: AssessmentQuestionRef[];
}

/** Payload for POST /assessments. */
export interface CreateAssessmentPayload {
  title: string;
  description: string;
  questionIds: string[];
}
