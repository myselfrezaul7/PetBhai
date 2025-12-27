import { Request, Response, NextFunction } from 'express';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// HTTP method colors
const methodColors: Record<string, string> = {
  GET: colors.green,
  POST: colors.blue,
  PUT: colors.yellow,
  PATCH: colors.yellow,
  DELETE: colors.red,
};

// Status code colors
const getStatusColor = (status: number): string => {
  if (status >= 500) return colors.red;
  if (status >= 400) return colors.yellow;
  if (status >= 300) return colors.cyan;
  if (status >= 200) return colors.green;
  return colors.reset;
};

// Format duration
const formatDuration = (ms: number): string => {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Get client IP address
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  return req.socket?.remoteAddress || 'unknown';
};

// Request logger middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end.bind(res);

  // Override end to log after response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.end = function (
    this: Response,
    chunk?: any,
    encoding?: BufferEncoding | (() => void),
    cb?: () => void
  ) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const methodColor = methodColors[req.method] || colors.reset;
    const statusColor = getStatusColor(statusCode);

    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Format: [timestamp] METHOD /path STATUS duration - IP
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ` +
        `${methodColor}${method}${colors.reset} ` +
        `${url} ` +
        `${statusColor}${statusCode}${colors.reset} ` +
        `${colors.dim}${formatDuration(duration)}${colors.reset} - ` +
        `${colors.dim}${ip}${colors.reset}`
    );

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(
        `${colors.yellow}[SLOW REQUEST]${colors.reset} ${method} ${url} took ${formatDuration(duration)}`
      );
    }

    // Log errors with more details
    if (statusCode >= 500) {
      console.error(
        `${colors.red}[ERROR]${colors.reset} ${method} ${url} - ` +
          `Status: ${statusCode}, IP: ${ip}, UserAgent: ${userAgent}`
      );
    }

    // Call original end function with proper signature handling
    if (typeof encoding === 'function') {
      return originalEnd(chunk, encoding);
    }
    if (encoding) {
      return originalEnd(chunk, encoding, cb);
    }
    return originalEnd(chunk, cb);
  } as typeof res.end;

  next();
};

// Error logger
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = getClientIp(req);

  console.error(
    `${colors.red}[${timestamp}] ERROR${colors.reset}\n` +
      `  Method: ${method}\n` +
      `  URL: ${url}\n` +
      `  IP: ${ip}\n` +
      `  Error: ${err.message}\n` +
      `  Stack: ${err.stack}`
  );

  next(err);
};

// Audit logger for sensitive operations
export const auditLog = (
  action: string,
  userId: number | string | undefined,
  details: Record<string, unknown>
): void => {
  const timestamp = new Date().toISOString();
  console.log(
    `${colors.magenta}[AUDIT ${timestamp}]${colors.reset} ` +
      `Action: ${action}, ` +
      `User: ${userId || 'anonymous'}, ` +
      `Details: ${JSON.stringify(details)}`
  );
};

// Security logger for potential threats
export const securityLog = (
  event: string,
  req: Request,
  details?: Record<string, unknown>
): void => {
  const timestamp = new Date().toISOString();
  const ip = getClientIp(req);
  console.warn(
    `${colors.red}[SECURITY ${timestamp}]${colors.reset} ` +
      `Event: ${event}, ` +
      `IP: ${ip}, ` +
      `URL: ${req.originalUrl || req.url}` +
      (details ? `, Details: ${JSON.stringify(details)}` : '')
  );
};

export default requestLogger;
