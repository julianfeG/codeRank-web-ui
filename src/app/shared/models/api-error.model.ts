/**
 * Problem Details error body the backend now sends on every HTTP error
 * response (replaces the old `{ error, details }` shape).
 *
 * `detail` is informational (debugging/logs) — it is never shown to the
 * user; the frontend keeps its own copy and decides what to display using
 * `codeError`, not by parsing `title`/`detail` text. `fieldErrors` replaces
 * the old `details` for per-field validation messages.
 */
export interface ApiError {
  title: string;
  status: number;
  detail: string;
  instance: string;
  codeError: string;
  timestamp: string;
  fieldErrors?: Record<string, string[]>;
}
