/**
 * Fixed catalog of categories offered in the UI (question form + library filters).
 * Front-end only — the backend still accepts any string for `category`, so existing
 * questions created with a different value (or via API directly) keep working; they
 * just won't match this list's exact casing when filtering.
 */
export const QUESTION_CATEGORIES = [
  'Algorithms',
  'Arquitectura',
  'Backend',
  'Cloud/AWS',
  'Docker',
  'JavaScript',
  'SQL',
  'TypeScript',
] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];
