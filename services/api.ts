// API Configuration and Utilities
// Centralized API handling with error management, retries, and caching

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Request timeout (30 seconds default)
const DEFAULT_TIMEOUT = 30000;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Simple in-memory cache for GET requests
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

// Periodic cache cleanup (every 60 seconds)
let cacheCleanupTimer: ReturnType<typeof setInterval> | null = null;
const startCacheCleanup = () => {
  if (cacheCleanupTimer) return;
  cacheCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp >= CACHE_TTL) {
        cache.delete(key);
      }
    }
    if (cache.size === 0 && cacheCleanupTimer) {
      clearInterval(cacheCleanupTimer);
      cacheCleanupTimer = null;
    }
  }, 60000);
};

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Request options interface
interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  useCache?: boolean;
  cacheTTL?: number;
}

// Fetch with timeout wrapper
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError();
    }
    throw error;
  }
};

// Sleep utility for retries
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Check if error is retryable
const isRetryable = (error: unknown): boolean => {
  if (error instanceof TimeoutError) return true;
  if (error instanceof NetworkError) return true;
  if (error instanceof ApiError) {
    // Retry on server errors (5xx) but not client errors (4xx)
    return error.status >= 500;
  }
  return false;
};

// Main API request function
export const apiRequest = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = MAX_RETRIES,
    useCache = false,
    cacheTTL = CACHE_TTL,
    ...fetchOptions
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const method = fetchOptions.method || 'GET';

  // Check cache for GET requests
  if (useCache && method === 'GET') {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      return cached.data as T;
    }
  }

  // Default headers — skip Content-Type for FormData (browser sets it with boundary)
  const headers: Record<string, string> = {
    ...(fetchOptions.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          ...fetchOptions,
          headers,
        },
        timeout
      );

      // Handle non-OK responses
      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          // Response body might not be JSON
        }

        const message =
          (errorData as { message?: string })?.message ||
          (errorData as { error?: string })?.error ||
          `Request failed with status ${response.status}`;

        const apiError = new ApiError(message, response.status, errorData);

        // On 401, try refreshing the token once and retry the request
        if (response.status === 401 && attempt === 0) {
          const newToken = await attemptTokenRefresh();
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            attempt++; // count as one retry
            continue;
          }
        }

        throw apiError;
      }

      // Handle 204 No Content (e.g., successful DELETE)
      if (response.status === 204) {
        return {} as T;
      }

      // Parse response
      const data = await response.json();

      // Cache GET responses
      if (useCache && method === 'GET') {
        // Evict oldest entries if cache is full
        if (cache.size >= MAX_CACHE_SIZE) {
          const oldestKey = cache.keys().next().value;
          if (oldestKey) cache.delete(oldestKey);
        }
        cache.set(url, { data, timestamp: Date.now() });
        startCacheCleanup();
      }

      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < retries && isRetryable(error)) {
        attempt++;
        await sleep(RETRY_DELAY * Math.pow(2, attempt - 1)); // Exponential backoff
        continue;
      }

      // No more retries, throw the error
      if (
        error instanceof Error &&
        error.name === 'TypeError' &&
        error.message === 'Failed to fetch'
      ) {
        throw new NetworkError(
          'Unable to connect to the server. Please check your internet connection.'
        );
      }

      throw error;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Request failed');
};

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

// Token management
const TOKEN_KEY = 'petbhai_auth_token';
const REFRESH_TOKEN_KEY = 'petbhai_refresh_token';

// Token refresh state — prevents parallel refresh attempts
let refreshPromise: Promise<string | null> | null = null;

export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage might be disabled
  }
};

export const setRefreshToken = (token: string): void => {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // localStorage might be disabled
  }
};

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearAuthToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // localStorage might be disabled
  }
};

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Coalesces concurrent calls so only one refresh request is in-flight.
 */
const attemptTokenRefresh = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const url = `${API_URL}/auth/refresh`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.token) {
        setAuthToken(data.token);
        if (data.refreshToken) setRefreshToken(data.refreshToken);
        return data.token as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Cache management
export const clearApiCache = (): void => {
  cache.clear();
};

export const invalidateCache = (pattern?: string): void => {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// Health check
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get<{ status: string }>('/health', {
      timeout: 5000,
      retries: 0,
    });
    return response.status === 'ok';
  } catch {
    return false;
  }
};

export default api;
