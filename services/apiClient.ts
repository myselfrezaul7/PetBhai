import { safeStorage, safeSessionStorage } from '../lib/storage';
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
  public code?: string;
  public reqId?: string;
  public details?: unknown;
  public retryable: boolean;

  constructor(
    message: string,
    public statusCode?: number,
    payload?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiRequestError';
    
    if (payload) {
      this.code = typeof payload.code === 'string' ? payload.code : undefined;
      this.reqId = typeof payload.reqId === 'string' ? payload.reqId : undefined;
      this.details = payload.details;
    }

    // Determine if the error is likely transient and safe to retry
    this.retryable = 
      statusCode === 408 || // Request Timeout
      statusCode === 429 || // Too Many Requests
      statusCode === 502 || // Bad Gateway
      statusCode === 503 || // Service Unavailable (including PersistenceError)
      statusCode === 504 || // Gateway Timeout
      !statusCode; // Network/Offline errors
  }
}

type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
};

const SESSION_STORAGE_KEY = 'petbhai_session_id';

const getSessionId = (): string => {
  try {
    const existing = safeSessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const generated =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    safeSessionStorage.setItem(SESSION_STORAGE_KEY, generated);
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

const getStoredAuthToken = (): string | null => {
  try {
    return safeStorage.getItem('petbhai_token');
  } catch {
    return null;
  }
};

export const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const headers = response.headers as
    | { get?: (name: string) => string | null; ['content-type']?: string }
    | undefined;
  const contentType =
    (typeof headers?.get === 'function' ? headers.get('content-type') : headers?.['content-type']) ||
    '';
  const hasJsonBody = typeof response.json === 'function';
  const hasTextBody = typeof response.text === 'function';

  if (contentType.toLowerCase().includes('application/json') && hasJsonBody) {
    return response.json().catch(() => null);
  }

  if (!contentType && hasJsonBody) {
    return response.json().catch(() => null);
  }

  if (!hasTextBody) {
    return null;
  }

  const text = await response.text().catch(() => '');
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { timeoutMs = 15000, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set('X-Requested-With', 'XMLHttpRequest');
  requestHeaders.set('X-Session-Id', getSessionId());

  if (!requestHeaders.has('Authorization')) {
    const token = getStoredAuthToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(path), {
      ...requestOptions,
      headers: requestHeaders,
      credentials: requestOptions.credentials ?? 'same-origin',
      signal: controller.signal,
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const errorPayload = (payload ?? {}) as Record<string, unknown>;
      const message =
        typeof errorPayload?.message === 'string' && errorPayload.message.trim().length > 0
          ? errorPayload.message
          : typeof errorPayload?.error === 'string' && errorPayload.error.trim().length > 0
            ? errorPayload.error
            : `Request failed with status ${response.status}`;

      throw new ApiRequestError(message, response.status, errorPayload);
    }

    if (response.status === 204 || payload === null || typeof payload === 'undefined') {
      return undefined as T;
    }

    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutErr = new ApiRequestError('Request timed out. Please try again.', 408);
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const offlineErr = new ApiRequestError(
        isOffline ? 'You appear to be offline.' : 'Network error. Please check your connection.',
        0
      );
      offlineErr.code = isOffline ? 'OFFLINE' : 'NETWORK_ERROR';
      throw offlineErr;
    }

    if (error instanceof ApiRequestError) {
      throw error;
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
