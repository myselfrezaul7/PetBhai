import { Request, Response, NextFunction } from 'express';
import { securityLog } from './logger';

// HTML entities map
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

// Escape HTML characters to prevent XSS
export const escapeHtml = (str: string): string => {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
};

// Remove dangerous characters and patterns
export const sanitizeString = (str: string, maxLength = 1000): string => {
  if (typeof str !== 'string') return '';

  return (
    str
      // Trim whitespace
      .trim()
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Limit length
      .slice(0, maxLength)
  );
};

// Deep sanitize an object (recursively)
export const sanitizeObject = <T extends object>(obj: T, maxDepth = 10): T => {
  if (maxDepth <= 0) return obj;

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Sanitize the key itself
    const sanitizedKey = sanitizeString(key, 100);

    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map((item) => {
        if (typeof item === 'string') return sanitizeString(item);
        if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item, maxDepth - 1);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      sanitized[sanitizedKey] = sanitizeObject(value as object, maxDepth - 1);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }

  return sanitized as T;
};

// Dangerous patterns to detect
const dangerousPatterns = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i, // onclick=, onerror=, etc.
  /data:/i,
  /vbscript:/i,
  /expression\s*\(/i,
  /url\s*\(/i,
  /import\s*\(/i,
  /fetch\s*\(/i,
  /eval\s*\(/i,
  /setTimeout\s*\(/i,
  /setInterval\s*\(/i,
  /Function\s*\(/i,
  /\.\.\//g, // Path traversal
  /%2e%2e/i, // Encoded path traversal
  /%00/i, // Null byte injection
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<svg.*onload/i,
  /<img.*onerror/i,
];

// SQL injection patterns
const sqlInjectionPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
  /(--|\/\*|\*\/|;)/,
  /(\bOR\b|\bAND\b)\s*[\d'"]?\s*[=<>]/i,
  /'\s*(OR|AND)\s*'/i,
];

// Detect potentially malicious content
export const detectMaliciousContent = (str: string): boolean => {
  if (typeof str !== 'string') return false;

  // Check for dangerous HTML/JS patterns
  for (const pattern of dangerousPatterns) {
    if (pattern.test(str)) return true;
  }

  return false;
};

// Detect SQL injection attempts
export const detectSqlInjection = (str: string): boolean => {
  if (typeof str !== 'string') return false;

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(str)) return true;
  }

  return false;
};

// Check object for malicious content
const checkObjectForMalicious = (obj: unknown, path = ''): string[] => {
  const threats: string[] = [];

  if (typeof obj === 'string') {
    if (detectMaliciousContent(obj)) {
      threats.push(`XSS attempt at ${path || 'root'}`);
    }
    if (detectSqlInjection(obj)) {
      threats.push(`SQL injection attempt at ${path || 'root'}`);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      threats.push(...checkObjectForMalicious(item, `${path}[${index}]`));
    });
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      threats.push(...checkObjectForMalicious(value, path ? `${path}.${key}` : key));
    }
  }

  return threats;
};

// XSS protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Check request body for malicious content
  if (req.body && typeof req.body === 'object') {
    const threats = checkObjectForMalicious(req.body);

    if (threats.length > 0) {
      securityLog('POTENTIAL_XSS_ATTACK', req, { threats });
      res.status(400).json({
        error: 'Invalid input detected',
        message: 'Your request contains potentially harmful content',
      });
      return;
    }

    // Sanitize the body
    req.body = sanitizeObject(req.body);
  }

  // Check query parameters
  if (req.query && typeof req.query === 'object') {
    const queryThreats = checkObjectForMalicious(req.query);

    if (queryThreats.length > 0) {
      securityLog('POTENTIAL_XSS_IN_QUERY', req, { threats: queryThreats });
      res.status(400).json({
        error: 'Invalid query parameters',
        message: 'Your request contains potentially harmful content',
      });
      return;
    }
  }

  next();
};

// SQL injection protection middleware
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction): void => {
  const checkValue = (val: unknown): boolean => {
    if (typeof val === 'string') {
      return detectSqlInjection(val);
    }
    if (Array.isArray(val)) {
      return val.some(checkValue);
    }
    if (typeof val === 'object' && val !== null) {
      return Object.values(val).some(checkValue);
    }
    return false;
  };

  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    securityLog('POTENTIAL_SQL_INJECTION', req);
    res.status(400).json({
      error: 'Invalid input detected',
      message: 'Your request contains potentially harmful content',
    });
    return;
  }

  next();
};

// Combined security middleware
export const securityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Skip security checks for file uploads (handled separately)
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }

  // Apply XSS protection
  xssProtection(req, res, () => {
    // Apply SQL injection protection
    sqlInjectionProtection(req, res, next);
  });
};

// Utility: Sanitize user input for display
export const sanitizeForDisplay = (str: string): string => {
  return escapeHtml(sanitizeString(str));
};

// Utility: Sanitize filename
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
};

// Utility: Sanitize URL
export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

export default securityMiddleware;
