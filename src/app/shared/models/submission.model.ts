/** Shapes verified against the live backend (http://localhost:3000/api) on 2026-08-07. */

export type SubmissionStatus = 'IN_PROGRESS' | 'SUBMITTED';

/** Raw submission document — returned by POST /submissions and POST /submissions/:id/submit. */
export interface Submission {
  id: string;
  assessmentId: string;
  candidateName: string;
  candidateEmail: string;
  startedAt: string;
  submittedAt: string | null;
  status: SubmissionStatus;
}

/** Per-test-case grading detail for a CODE answer, as run against the question's testCases. */
export interface TestResult {
  input: unknown;
  expectedOutput: unknown;
  actualOutput: unknown;
  passed: boolean;
  error?: string;
}

/**
 * One graded answer, nested inside a submission — no submissionId back-reference.
 * `passed`/`score` are null/0 until run-code has executed a CODE answer, or
 * immediately populated for MULTIPLE_CHOICE (graded synchronously on save).
 */
export interface SubmissionAnswer {
  id: string;
  questionId: string;
  selectedOptionId: string | null;
  submittedCode: string | null;
  /** Present (non-null) when type === 'CODE'. */
  language: string | null;
  /** Present (non-null) when type === 'CODE' after run-code has executed. */
  testResults: TestResult[] | null;
  passed: boolean | null;
  score: number;
}

/** Payload for POST /submissions. */
export interface CreateSubmissionPayload {
  assessmentId: string;
  candidateName: string;
  candidateEmail: string;
}

/** Answer payload for a MULTIPLE_CHOICE question. */
export interface SaveMultipleChoiceAnswerPayload {
  questionId: string;
  selectedOptionId: string;
}

/** Answer payload for a CODE question — submittedCode and language are required together. */
export interface SaveCodeAnswerPayload {
  questionId: string;
  submittedCode: string;
  language: string;
}

/**
 * Payload for POST /submissions/:id/answers. Upserts — POSTing again for the
 * same questionId updates the existing answer rather than creating a new one.
 */
export type SaveAnswerPayload = SaveMultipleChoiceAnswerPayload | SaveCodeAnswerPayload;

/**
 * Payload for POST /submissions/:id/run-code. Requires an answer to already
 * exist for this question (save it via saveAnswer first) — the backend runs
 * whatever submittedCode was last saved.
 */
export interface RunCodePayload {
  questionId: string;
}

/** Row shape for the candidates table (GET /assessments/:id/submissions). */
export interface SubmissionSummary {
  id: string;
  candidateName: string;
  candidateEmail: string;
  status: SubmissionStatus;
  startedAt: string;
  submittedAt: string | null;
  totalScore: number;
  maxScore: number;
}

/** Graded result view returned by GET /submissions/:id, shared between candidate and recruiter screens. */
export interface SubmissionResult {
  submission: Submission;
  answers: SubmissionAnswer[];
  totalScore: number;
  maxScore: number;
}
