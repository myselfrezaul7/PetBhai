/**
 * Security utilities for input sanitization and validation
 * Helps prevent XSS, injection attacks, and other vulnerabilities
 */

// HTML entities to escape for XSS prevention
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
export const escapeHtml = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
};

/**
 * Sanitizes user input by trimming whitespace and limiting length
 */
export const sanitizeInput = (
  input: string,
  maxLength: number = 10000,
  options: { trim?: boolean; allowNewlines?: boolean } = {}
): string => {
  const { trim = true, allowNewlines = true } = options;

  if (typeof input !== 'string') return '';

  let sanitized = input;

  // Remove null bytes and other control characters (except newlines/tabs if allowed)
  if (allowNewlines) {
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  } else {
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, ' ');
  }

  // Trim if requested
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
};

/**
 * Validates and sanitizes a URL to prevent javascript: and data: attacks
 */
export const sanitizeUrl = (url: string): string | null => {
  if (typeof url !== 'string' || !url.trim()) return null;

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some((protocol) => trimmed.startsWith(protocol))) {
    return null;
  }

  // Allow relative URLs, http, https, and blob (for image previews)
  const safeProtocols = ['http://', 'https://', 'blob:', '/'];
  const isRelativeOrSafe =
    safeProtocols.some((protocol) => trimmed.startsWith(protocol)) ||
    (!trimmed.includes(':') && !trimmed.startsWith('//'));

  if (!isRelativeOrSafe && !trimmed.startsWith('data:image/')) {
    return null;
  }

  // Allow data:image/ for base64 images (common for user uploads)
  if (trimmed.startsWith('data:') && !trimmed.startsWith('data:image/')) {
    return null;
  }

  return url.trim();
};

/**
 * Validates image data URL format
 */
export const isValidImageDataUrl = (dataUrl: string): boolean => {
  if (typeof dataUrl !== 'string') return false;

  const validImageMimeTypes = [
    'data:image/jpeg',
    'data:image/jpg',
    'data:image/png',
    'data:image/gif',
    'data:image/webp',
    'data:image/svg+xml',
  ];

  return validImageMimeTypes.some((mime) => dataUrl.toLowerCase().startsWith(mime));
};

/**
 * Rate limiting helper for client-side actions
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canProceed(): boolean {
    const now = Date.now();
    // Remove old timestamps outside the window
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);

    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }

    this.timestamps.push(now);
    return true;
  }

  reset(): void {
    this.timestamps = [];
  }

  getTimeUntilReset(): number {
    if (this.timestamps.length === 0) return 0;
    const oldestTimestamp = this.timestamps[0];
    return Math.max(0, this.windowMs - (Date.now() - oldestTimestamp));
  }
}

/**
 * Validates file type based on magic bytes (more secure than extension)
 */
export const validateImageFile = async (
  file: File
): Promise<{ valid: boolean; error?: string }> => {
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB

  // Check size first
  if (file.size > maxSizeBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Image is ${sizeMB}MB. Maximum allowed is 5MB.`,
    };
  }

  // Check MIME type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, GIF, and WebP images are allowed.',
    };
  }

  // Optional: Check magic bytes for additional security
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const signatures: Record<string, number[][]> = {
      jpeg: [[0xff, 0xd8, 0xff]],
      png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
      gif: [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
      ],
      webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP starts with RIFF)
    };

    const isValidSignature = Object.values(signatures).some((sigs) =>
      sigs.some((sig) => sig.every((byte, i) => bytes[i] === byte))
    );

    if (!isValidSignature) {
      return {
        valid: false,
        error: 'Invalid image file. The file may be corrupted or not a valid image.',
      };
    }
  } catch {
    // If we can't read the file, let the server validate
  }

  return { valid: true };
};

/**
 * Debounce function for preventing rapid repeated calls
 */
export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * Throttle function for rate-limiting UI updates
 */
export const throttle = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Content length validator with friendly error messages
 */
export const validateContentLength = (
  content: string,
  minLength: number = 1,
  maxLength: number = 5000,
  fieldName: string = 'Content'
): { valid: boolean; error?: string } => {
  const trimmed = content.trim();

  if (trimmed.length < minLength) {
    if (minLength === 1) {
      return { valid: false, error: `${fieldName} cannot be empty.` };
    }
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters.` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} cannot exceed ${maxLength} characters.` };
  }

  return { valid: true };
};
