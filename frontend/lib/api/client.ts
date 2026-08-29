/**
 * Shared fetch wrapper. P4/P5 import this — keep names stable.
 * Paths have no /v1 prefix (`/me`, `/facilities/recommend`).
 */
import { getIdToken } from "../auth";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return base.replace(/\/$/, "");
}

type ErrorEnvelope = {
  error?: {
    code?: unknown;
    message?: unknown;
  };
};

function parseErrorEnvelope(status: number, body: unknown): ApiError {
  if (body && typeof body === "object" && "error" in body) {
    const envelope = (body as ErrorEnvelope).error;
    const code =
      typeof envelope?.code === "string" ? envelope.code : "unknown_error";
    const message =
      typeof envelope?.message === "string"
        ? envelope.message
        : `Request failed (${status})`;
    return new ApiError(status, code, message);
  }
  return new ApiError(status, "unknown_error", `Request failed (${status})`);
}

async function readJsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * Fetch JSON from the CareFlow API. Attaches Bearer when a Firebase ID token
 * is available (optional auth; recommend is public). GET never sends a body.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  const token = await getIdToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const body = method === "GET" || method === "HEAD" ? undefined : init?.body;
  if (body !== undefined && body !== null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = `${getApiBaseUrl()}${suffix}`;

  let res: Response;
  try {
    res = await fetch(url, { ...init, method, headers, body });
  } catch {
    throw new ApiError(0, "network_error", "Network error");
  }

  const parsed = await readJsonBody(res);
  if (!res.ok) {
    throw parseErrorEnvelope(res.status, parsed);
  }
  return parsed as T;
}
