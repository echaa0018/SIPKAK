import { getReporterId } from '../lib/reporterId';

/** An error answer from the API ({ error: { code, message, details } }) or a network failure. */
export class ApiError extends Error {
  readonly status: number;
  /** The API's error code, e.g. "VALIDATION_ERROR", or "NETWORK" when the server can't be reached. */
  readonly code: string;
  /** Messages per field, e.g. { description: "Too short" }. */
  readonly details: Record<string, string>;

  constructor(status: number, code: string, message: string, details: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  /** Admin token, sent as "Authorization: Bearer …". */
  token?: string;
}

// The only place in the frontend that calls fetch. Every request says who "you" are,
// so the API can set isMine; some endpoints require it.
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  const headers: Record<string, string> = { 'X-Reporter-Id': getReporterId() };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = data?.error;
    throw new ApiError(
      res.status,
      error?.code ?? 'INTERNAL',
      error?.message ?? `Request failed with ${res.status}`,
      error?.details,
    );
  }
  return data as T;
}
