import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Environment variable for JWT secret (should be set in production)
const JWT_SECRET = process.env.JWT_SECRET || 'petbhai_secret_key_change_in_production';

// Extended Request type with user info
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    isPlusMember?: boolean;
    isAdmin?: boolean;
  };
}

// JWT payload interface
export interface JwtPayload {
  id: number;
  email: string;
  name: string;
  isPlusMember?: boolean;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

// Generate JWT token
export const generateToken = (user: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

// Authentication middleware - required auth
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
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
    }
  }

  next();
};

// Admin only middleware
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

// Plus member middleware
export const requirePlusMember = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isPlusMember) {
    res.status(403).json({ error: 'PetBhai+ membership required' });
    return;
  }

  next();
};
