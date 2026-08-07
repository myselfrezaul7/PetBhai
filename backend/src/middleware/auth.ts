import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { securityLog } from './logger';
import { db } from '../db';

const JWT_ISSUER = 'petbhai-api';
const JWT_AUDIENCE = 'petbhai-client';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';

const getJwtSecret = (): string => {
  const configuredSecret = process.env.JWT_SECRET;

  if (configuredSecret && configuredSecret.trim().length >= 32) {
    return configuredSecret;
  }

  throw new Error(
    'JWT_SECRET is missing or too weak. Configure a strong secret with at least 32 characters in your .env file.'
  );
};

// Extended Request type with user info
export interface AuthRequest extends Request {
  user?: {
    id: number | string;
    email: string;
    name: string;
    isPlusMember?: boolean;
    isAdmin?: boolean;
    role?: 'customer' | 'moderator' | 'store_manager' | 'super_admin';
  };
}

// JWT payload interface
export interface JwtPayload {
  id: number | string;
  email: string;
  name: string;
  isPlusMember?: boolean;
  isAdmin?: boolean;
  role?: 'customer' | 'moderator' | 'store_manager' | 'super_admin';
  tokenType?: 'access' | 'refresh';
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload extends JwtPayload {
  tokenType: 'refresh';
  tokenVersion: number;
}

// Generate JWT token
export const generateToken = (user: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return generateAccessToken(user);
};

export const generateAccessToken = (user: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(user, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: ACCESS_TOKEN_TTL,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

export const generateRefreshToken = (
  user: Omit<JwtPayload, 'iat' | 'exp' | 'tokenType' | 'tokenVersion'>,
  tokenVersion: number
): string => {
  return jwt.sign(
    {
      ...user,
      tokenType: 'refresh',
      tokenVersion,
    },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      expiresIn: REFRESH_TOKEN_TTL,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as JwtPayload;

    if (decoded.tokenType === 'refresh') {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as RefreshTokenPayload;

    if (decoded.tokenType !== 'refresh' || typeof decoded.tokenVersion !== 'number') {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

// Authentication middleware - required auth
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const reqId = (req as any).reqId || 'unknown';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    securityLog('AUTH_MISSING_OR_MALFORMED_HEADER', req, {
      path: req.originalUrl || req.url,
      method: req.method,
    });
    res.status(401).json({ error: 'Authentication Error', message: 'Authentication required', reqId });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    securityLog('AUTH_INVALID_OR_EXPIRED_TOKEN', req, {
      path: req.originalUrl || req.url,
      method: req.method,
    });
    res.status(401).json({ error: 'Authentication Error', message: 'Invalid or expired token', reqId });
    return;
  }

  const user = db.users.find((u: any) => String(u.id) === String(decoded.id));
  if (!user || user.bannedAt || (user.tokenVersion !== undefined && decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion)) {
    securityLog('AUTH_USER_SUSPENDED_OR_INVALIDATED', req, {
      path: req.originalUrl || req.url,
      method: req.method,
      userId: decoded.id
    });
    res.status(401).json({ error: 'Authentication Error', message: 'Account suspended or session invalidated', reqId });
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

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const reqId = (req as any).reqId || 'unknown';

    if (!req.user) {
      securityLog('AUTH_REQUIRED_FOR_ROLE', req, {
        path: req.originalUrl || req.url,
        method: req.method,
      });
      res.status(401).json({ error: 'Authentication Error', message: 'Authentication required', reqId });
      return;
    }

    const userRole = req.user.role || (req.user.isAdmin ? 'super_admin' : 'customer');
    if (!allowedRoles.includes(userRole)) {
      securityLog('ROLE_FORBIDDEN', req, {
        userId: req.user.id,
        role: userRole,
        required: allowedRoles,
        path: req.originalUrl || req.url,
        method: req.method,
      });
      res.status(403).json({ error: 'Authorization Error', message: 'Insufficient permissions', reqId });
      return;
    }

    next();
  };
};

// Admin only middleware (Legacy - aliases to super_admin or store_manager)
export const requireAdmin = requireRole(['super_admin', 'store_manager']);

// Plus member middleware
export const requirePlusMember = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const reqId = (req as any).reqId || 'unknown';

  if (!req.user) {
    securityLog('PLUS_AUTH_REQUIRED', req, {
      path: req.originalUrl || req.url,
      method: req.method,
    });
    res.status(401).json({ error: 'Authentication Error', message: 'Authentication required', reqId });
    return;
  }

  if (!req.user.isPlusMember) {
    securityLog('PLUS_FORBIDDEN', req, {
      userId: req.user.id,
      path: req.originalUrl || req.url,
      method: req.method,
    });
    res.status(403).json({ error: 'Authorization Error', message: 'PetBhai+ membership required', reqId });
    return;
  }

  next();
};
