const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string | null;
};

/**
 * Typed JSON fetch. Injects auth header, parses JSON, throws ApiError on non-2xx.
 * Returns undefined for 204 No Content.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, body, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : null) ?? res.statusText;
    const details =
      payload && typeof payload === 'object' && 'details' in payload
        ? payload.details
        : undefined;
    if (res.status === 401 && token) {
      // Token rejected by the server (expired or revoked). Tell the auth layer
      // so it can drop the session; RequireAuth will then redirect to /login.
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw new ApiError(res.status, message, details);
  }

  return payload as T;
}
