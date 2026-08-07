/** Payload for POST /auth/login. */
export interface LoginPayload {
  username: string;
  password: string;
}

/** Response for POST /auth/login. */
export interface LoginResponse {
  token: string;
}
