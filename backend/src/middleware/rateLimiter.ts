import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiter for AI endpoints (expensive operations)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 AI requests per minute
  message: {
    error: 'Too many AI requests, please try again after a minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for file uploads
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: {
    error: 'Too many uploads, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for order creation
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 orders per hour
  message: {
    error: 'Order limit reached, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom rate limiter that can be configured per route
export const createRateLimiter = (
  windowMs: number,
  max: number,
  message = 'Too many requests, please try again later'
) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Slow down middleware for repeated requests
export const slowDown = (req: Request, res: Response, next: NextFunction): void => {
  // This is a simplified version - in production, use express-slow-down package
  // For now, we just pass through
  next();
};
