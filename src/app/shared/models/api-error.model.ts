/** Normalized shape the error interceptor produces from the backend's { error, details }. */
export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}
