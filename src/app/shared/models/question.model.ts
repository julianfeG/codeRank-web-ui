/** Shapes verified against the live backend (http://localhost:3000/api) on 2026-08-07. */

export type QuestionType = 'MULTIPLE_CHOICE' | 'CODE';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

/** A selectable option for a MULTIPLE_CHOICE question. */
export interface QuestionOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
}

/** One input/output pair used to grade a CODE question. */
export interface TestCase {
  input: unknown;
  output: unknown;
}

/** Full question as returned by the question bank endpoints. There is no title — `statement` is the prompt. */
export interface Question {
  id: string;
  category: string;
  difficulty: Difficulty;
  type: QuestionType;
  statement: string;
  /** Populated when type === 'CODE'. */
  allowedLanguages: string[];
  /** Present (non-null) when type === 'CODE'. */
  functionName: string | null;
  /**
   * Present (non-null) when type === 'CODE'. Keyed by language, e.g.
   * `{ javascript: "...", python: "...", java: "..." }`. Generated server-side from
   * functionName + allowedLanguages — never sent in CreateQuestionPayload.
   */
  starterCodeTemplates: Record<string, string> | null;
  /** Present (non-null) when type === 'CODE'. */
  testCases: TestCase[] | null;
  /** Populated when type === 'MULTIPLE_CHOICE', empty array otherwise. */
  options: QuestionOption[];
}

export interface CreateQuestionOptionPayload {
  text: string;
  isCorrect: boolean;
}

/** Payload for POST /questions. */
export interface CreateQuestionPayload {
  category: string;
  difficulty: Difficulty;
  type: QuestionType;
  statement: string;
  /** MULTIPLE_CHOICE only. */
  options?: CreateQuestionOptionPayload[];
  /** CODE only. */
  allowedLanguages?: string[];
  /** CODE only. */
  functionName?: string;
  /** CODE only. */
  testCases?: TestCase[];
}
