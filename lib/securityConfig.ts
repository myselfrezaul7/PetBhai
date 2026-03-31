/**
 * Frontend Security Configuration
 * Centralized security settings for the PetBhai application
 */

import { apiRequest } from '../services/apiClient';

// Security headers that should be sent with API requests
export const securityHeaders = {
  'X-Requested-With': 'XMLHttpRequest',
  'X-Content-Type-Options': 'nosniff',
};

// Get session ID for CSRF protection
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('petbhai_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('petbhai_session_id', sessionId);
  }
  return sessionId;
};

// CSRF token management
let csrfToken: string | null = null;
let csrfTokenExpiry: number = 0;
const CSRF_TOKEN_REFRESH = 25 * 60 * 1000; // Refresh 5 mins before expiry (30 min TTL)

export const getCSRFToken = async (): Promise<string> => {
  // Return cached token if still valid
  if (csrfToken && Date.now() < csrfTokenExpiry) {
    return csrfToken;
  }

  try {
    const data = await apiRequest<{ csrfToken?: string }>('/csrf-token', {
      headers: {
        'X-Session-Id': getSessionId(),
      },
    });

    csrfToken = data.csrfToken ?? null;
    csrfTokenExpiry = Date.now() + CSRF_TOKEN_REFRESH;
    return csrfToken as string;
  } catch (error) {
    console.error('CSRF token fetch failed:', error);
    // Return empty string - request will still work with JWT auth
    return '';
  }
};

// Create secure fetch wrapper
export const secureFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers);

  // Add security headers
  headers.set('X-Requested-With', 'XMLHttpRequest');
  headers.set('X-Session-Id', getSessionId());

  // Add CSRF token for state-changing requests
  const method = options.method?.toUpperCase() || 'GET';
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = await getCSRFToken();
    if (token) {
      headers.set('X-CSRF-Token', token);
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
};

// Input validation helpers
export const validators = {
  // Email validation
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone number validation (Bangladesh)
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^(\+880|880|0)?1[3-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  },

  // Password strength check
  isStrongPassword: (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain an uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain a lowercase letter' };
    }
    if (!/\d/.test(password)) {
      return { valid: false, message: 'Password must contain a number' };
    }
    return { valid: true, message: 'Password is strong' };
  },

  // URL validation
  isValidUrl: (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  // Sanitize HTML to prevent XSS
  sanitizeHtml: (input: string): string => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };
    return input.replace(/[&<>"']/g, (char) => entities[char] || char);
  },
};

// Rate limiting for client-side actions
const actionCounts = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  action: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const data = actionCounts.get(action);

  if (!data || now > data.resetTime) {
    actionCounts.set(action, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (data.count >= maxAttempts) {
    return false;
  }

  data.count++;
  return true;
};

// Browser fingerprint for device identification
export const getBrowserFingerprint = async (): Promise<string> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth.toString(),
    `${screen.width}x${screen.height}`,
    new Date().getTimezoneOffset().toString(),
    (navigator.hardwareConcurrency || 'unknown').toString(),
  ];

  const data = components.join('|');
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
};

// Detect potentially malicious activity
export const detectSuspiciousActivity = (): boolean => {
  const indicators = [
    // Check for webdriver (automation)
    'webdriver' in navigator,
    // Check for headless browser indicators
    !navigator.plugins || navigator.plugins.length === 0,
    // Check for unusual screen size
    window.outerWidth === 0 || window.outerHeight === 0,
    // Check for automation frameworks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!(window as any).__selenium_unwrapped,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!(window as any).__webdriver_evaluate,
  ];

  return indicators.some((indicator) => indicator);
};

export default {
  securityHeaders,
  getSessionId,
  getCSRFToken,
  secureFetch,
  validators,
  checkRateLimit,
  getBrowserFingerprint,
  detectSuspiciousActivity,
};
