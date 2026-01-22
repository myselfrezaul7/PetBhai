import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { securityLog } from './logger';

// In-memory storage for CSRF tokens and suspicious IPs
// In production, use Redis or similar for distributed systems
const csrfTokens = new Map<string, { token: string; expires: number }>();
const suspiciousIPs = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>();
const requestFingerprints = new Map<string, { count: number; timestamps: number[] }>();

// Configuration
const CSRF_TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes
const SUSPICIOUS_THRESHOLD = 50; // requests per minute
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const FINGERPRINT_WINDOW = 60 * 1000; // 1 minute

// Known bot user agents
const BOT_USER_AGENTS = [
  /bot/i,
  /spider/i,
  /crawl/i,
  /slurp/i,
  /mediapartners/i,
  /wget/i,
  /curl/i,
  /python-requests/i,
  /axios/i,
  /node-fetch/i,
  /scrapy/i,
  /phantom/i,
  /selenium/i,
  /headless/i,
  /puppeteer/i,
  /playwright/i,
];

// Whitelisted good bots (search engines)
const GOOD_BOTS = [
  /googlebot/i,
  /bingbot/i,
  /yandexbot/i,
  /duckduckbot/i,
  /baiduspider/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
];

// Generate CSRF token
export const generateCSRFToken = (sessionId: string): string => {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + CSRF_TOKEN_EXPIRY,
  });
  return token;
};

// Validate CSRF token
export const validateCSRFToken = (sessionId: string, token: string): boolean => {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return stored.token === token;
};

// Get client IP with proxy support
const getClientIP = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
};

// Generate request fingerprint
const generateFingerprint = (req: Request): string => {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    getClientIP(req),
  ];
  return crypto.createHash('sha256').update(components.join('|')).digest('hex').slice(0, 16);
};

// Check if user agent is a bot
const isBot = (userAgent: string): { isBot: boolean; isGoodBot: boolean } => {
  if (!userAgent) return { isBot: true, isGoodBot: false };

  const isGoodBot = GOOD_BOTS.some((pattern) => pattern.test(userAgent));
  if (isGoodBot) return { isBot: true, isGoodBot: true };

  const isBadBot = BOT_USER_AGENTS.some((pattern) => pattern.test(userAgent));
  return { isBot: isBadBot, isGoodBot: false };
};

// Check for suspicious request patterns
const checkSuspiciousPatterns = (req: Request): string[] => {
  const warnings: string[] = [];

  // Check for missing headers that browsers always send
  if (!req.headers['accept']) {
    warnings.push('Missing Accept header');
  }
  if (!req.headers['accept-language']) {
    warnings.push('Missing Accept-Language header');
  }
  if (!req.headers['accept-encoding']) {
    warnings.push('Missing Accept-Encoding header');
  }

  // Check for suspicious headers
  if (req.headers['x-forwarded-for']?.toString().includes(',')) {
    const ips = req.headers['x-forwarded-for'].toString().split(',');
    if (ips.length > 5) {
      warnings.push('Excessive proxy hops');
    }
  }

  // Check for empty or very short user agent
  const ua = req.headers['user-agent'] || '';
  if (ua.length < 10) {
    warnings.push('Suspicious User-Agent');
  }

  // Check for requests coming too fast from same fingerprint
  const fingerprint = generateFingerprint(req);
  const fpData = requestFingerprints.get(fingerprint);
  if (fpData) {
    const now = Date.now();
    const recentTimestamps = fpData.timestamps.filter((t) => now - t < FINGERPRINT_WINDOW);
    if (recentTimestamps.length > SUSPICIOUS_THRESHOLD) {
      warnings.push('Request rate exceeded');
    }
  }

  return warnings;
};

// Update request tracking
const trackRequest = (req: Request): void => {
  const fingerprint = generateFingerprint(req);
  const now = Date.now();

  const existing = requestFingerprints.get(fingerprint);
  if (existing) {
    existing.timestamps = [...existing.timestamps.filter((t) => now - t < FINGERPRINT_WINDOW), now];
    existing.count++;
    requestFingerprints.set(fingerprint, existing);
  } else {
    requestFingerprints.set(fingerprint, { count: 1, timestamps: [now] });
  }

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to clean up
    for (const [key, data] of requestFingerprints.entries()) {
      if (data.timestamps.every((t) => now - t > FINGERPRINT_WINDOW * 5)) {
        requestFingerprints.delete(key);
      }
    }
  }
};

// Bot protection middleware
export const botProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip bot protection in development for easier testing
  if (process.env.NODE_ENV !== 'production' && process.env.SKIP_BOT_PROTECTION === 'true') {
    return next();
  }

  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';

  // Check if IP is blocked
  const suspiciousData = suspiciousIPs.get(ip);
  if (suspiciousData?.blocked) {
    if (Date.now() - suspiciousData.lastAttempt < BLOCK_DURATION) {
      securityLog('BLOCKED_IP_ATTEMPT', req, { ip });
      res.status(403).json({ error: 'Access temporarily blocked' });
      return;
    }
    // Unblock after duration
    suspiciousIPs.delete(ip);
  }

  // Check for bots
  const botCheck = isBot(userAgent);
  if (botCheck.isBot && !botCheck.isGoodBot) {
    // Check for common API routes that shouldn't be accessed by bots
    const restrictedPaths = ['/api/auth', '/api/orders', '/api/ai'];
    if (restrictedPaths.some((path) => req.path.startsWith(path))) {
      securityLog('BOT_ACCESS_ATTEMPT', req, { userAgent });
      res.status(403).json({ error: 'Automated access not allowed' });
      return;
    }
  }

  // Check for suspicious patterns
  const warnings = checkSuspiciousPatterns(req);
  if (warnings.length >= 3) {
    // Update suspicious IP tracking
    const existing = suspiciousIPs.get(ip) || { count: 0, lastAttempt: 0, blocked: false };
    existing.count++;
    existing.lastAttempt = Date.now();

    if (existing.count > 10) {
      existing.blocked = true;
      suspiciousIPs.set(ip, existing);
      securityLog('IP_BLOCKED', req, { ip, warnings, count: existing.count });
      res.status(403).json({ error: 'Suspicious activity detected' });
      return;
    }

    suspiciousIPs.set(ip, existing);
    securityLog('SUSPICIOUS_REQUEST', req, { warnings });
  }

  // Track the request
  trackRequest(req);

  next();
};

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for API endpoints that use JWT (already protected)
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  // Check CSRF token for state-changing requests
  const csrfToken = req.headers['x-csrf-token'] as string;
  const sessionId = (req.headers['x-session-id'] as string) || getClientIP(req);

  if (!csrfToken) {
    securityLog('MISSING_CSRF_TOKEN', req);
    res.status(403).json({ error: 'CSRF token required' });
    return;
  }

  if (!validateCSRFToken(sessionId, csrfToken)) {
    securityLog('INVALID_CSRF_TOKEN', req);
    res.status(403).json({ error: 'Invalid CSRF token' });
    return;
  }

  next();
};

// Endpoint to get CSRF token
export const getCSRFTokenHandler = (req: Request, res: Response): void => {
  const sessionId = (req.headers['x-session-id'] as string) || getClientIP(req);
  const token = generateCSRFToken(sessionId);
  res.json({ csrfToken: token });
};

// Honeypot validation middleware
export const honeypotValidation = (req: Request, res: Response, next: NextFunction): void => {
  // Check for honeypot field that should be empty
  const honeypotFields = ['website', 'url', 'fax', 'company_website', '_hp'];

  for (const field of honeypotFields) {
    if (req.body && req.body[field]) {
      securityLog('HONEYPOT_TRIGGERED', req, { field, value: req.body[field] });
      // Return success to confuse bots, but don't process
      res.json({ success: true, message: 'Request processed' });
      return;
    }
  }

  // Check for timing attack (form filled too quickly)
  const formTimestamp = req.body?._timestamp || req.body?.timestamp;
  if (formTimestamp) {
    const fillTime = Date.now() - parseInt(formTimestamp, 10);
    if (fillTime < 1000) {
      // Less than 1 second - likely a bot
      securityLog('FORM_FILLED_TOO_FAST', req, { fillTime });
      res.json({ success: true, message: 'Request processed' });
      return;
    }
  }

  // Clean honeypot fields before passing to next handler
  if (req.body) {
    for (const field of honeypotFields) {
      delete req.body[field];
    }
    delete req.body._timestamp;
    delete req.body.timestamp;
  }

  next();
};

// Export all protection middleware combined
export const fullBotProtection = [botProtection, honeypotValidation];

export default botProtection;
