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

  // Default headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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

        throw new ApiError(message, response.status, errorData);
      }

      // Parse response
      const data = await response.json();

      // Cache GET responses
      if (useCache && method === 'GET') {
        cache.set(url, { data, timestamp: Date.now() });
      }

      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < retries && isRetryable(error)) {
        attempt++;
        await sleep(RETRY_DELAY * attempt); // Exponential backoff
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

export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
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

export const clearAuthToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage might be disabled
  }
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
