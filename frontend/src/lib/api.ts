import { getToken } from "./auth";
import type { AuthResult } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Thrown for any non-2xx response, carrying the backend `message` + status. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Central request helper. Attaches the bearer token, parses the
 * `{ data, message }` envelope, and surfaces backend errors as `ApiError`.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const body = (await res.json().catch(() => null)) as {
    data: T;
    message: string;
  } | null;

  if (!res.ok) {
    throw new ApiError(
      body?.message ?? `Request failed (${res.status})`,
      res.status,
    );
  }
  return body!.data;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<AuthResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
};
