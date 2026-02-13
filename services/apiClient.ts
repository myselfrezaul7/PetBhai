const getApiBaseUrl = (): string => {
  try {
    const metaEnv = Function(
      'return typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : undefined;'
    )() as { VITE_API_URL?: string } | undefined;

    if (typeof metaEnv?.VITE_API_URL === 'string' && metaEnv.VITE_API_URL.trim().length > 0) {
      return metaEnv.VITE_API_URL;
    }
  } catch {
    // ignored: test/runtime environments may not support import.meta
  }

  return '/api';
};

const resolvedApiBaseUrl = getApiBaseUrl();

export const API_BASE_URL = resolvedApiBaseUrl;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
};

const SESSION_STORAGE_KEY = 'petbhai_session_id';

const getSessionId = (): string => {
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const generated =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    window.sessionStorage.setItem(SESSION_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
};

const buildUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { timeoutMs = 15000, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set('X-Requested-With', 'XMLHttpRequest');
  requestHeaders.set('X-Session-Id', getSessionId());

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(path), {
      ...requestOptions,
      headers: requestHeaders,
      credentials: requestOptions.credentials ?? 'same-origin',
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const message =
        typeof errorPayload?.message === 'string' && errorPayload.message.trim().length > 0
          ? errorPayload.message
          : typeof errorPayload?.error === 'string' && errorPayload.error.trim().length > 0
            ? errorPayload.error
            : `Request failed with status ${response.status}`;

      throw new ApiRequestError(message, response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiRequestError('Request timed out. Please try again.', 408);
    }

    if (error instanceof ApiRequestError) {
      throw error;
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
