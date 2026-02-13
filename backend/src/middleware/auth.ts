import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { securityLog } from './logger';

const JWT_ISSUER = 'petbhai-api';
const JWT_AUDIENCE = 'petbhai-client';

const getJwtSecret = (): string => {
  const configuredSecret = process.env.JWT_SECRET;

  if (configuredSecret && configuredSecret.trim().length >= 32) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to a strong value in production (min 32 chars).');
  }

  return 'dev_secret_local_only_not_for_production_use';
};

// Extended Request type with user info
export interface AuthRequest extends Request {
  user?: {
    id: number | string;
    email: string;
    name: string;
    isPlusMember?: boolean;
    isAdmin?: boolean;
  };
}

// JWT payload interface
export interface JwtPayload {
  id: number | string;
  email: string;
  name: string;
  isPlusMember?: boolean;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

// Generate JWT token
export const generateToken = (user: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(user, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: '7d',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as JwtPayload;
  } catch {
    return null;
  }
};

// Authentication middleware - required auth
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    securityLog('AUTH_MISSING_OR_MALFORMED_HEADER', req, {
      path: req.originalUrl || req.url,
      method: req.method,
    });
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    securityLog('AUTH_INVALID_OR_EXPIRED_TOKEN', req, {
      path: req.originalUrl || req.url,
      method: req.method,
    });
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = decoded;
  next();
};

// Optional authentication - sets user if token present
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    } else {
      securityLog('OPTIONAL_AUTH_INVALID_TOKEN', req, {
        path: req.originalUrl || req.url,
        method: req.method,
      });
    }
  }

  next();
};

// Admin only middleware
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    securityLog('ADMIN_AUTH_REQUIRED', req, {
      path: req.originalUrl || req.url,
      method: req.method,
    });
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isAdmin) {
    securityLog('ADMIN_FORBIDDEN', req, {
      userId: req.user.id,
      path: req.originalUrl || req.url,
      method: req.method,
    });
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

// Plus member middleware
export const requirePlusMember = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    securityLog('PLUS_AUTH_REQUIRED', req, {
      path: req.originalUrl || req.url,
      method: req.method,
    });
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isPlusMember) {
    securityLog('PLUS_FORBIDDEN', req, {
      userId: req.user.id,
      path: req.originalUrl || req.url,
      method: req.method,
    });
    res.status(403).json({ error: 'PetBhai+ membership required' });
    return;
  }

  next();
};
