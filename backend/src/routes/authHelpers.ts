
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db';
import type { MedicineReminderRecord, PetProfileRecord, User } from '../types';
import {
  AuthRequest,
  generateAccessToken,
  generateRefreshToken,
  requireAuth,
  verifyRefreshToken,
} from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { auditLog } from '../middleware/logger';



// Password hashing configuration
export const SALT_ROUNDS = 12;
export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export const loginAttemptTracker = new Map<
  string,
  { attempts: number; firstAttemptAt: number; lockUntil: number }
>();

export type AuthErrorCode =
  | 'AUTH_MISSING_EMAIL'
  | 'AUTH_INVALID_EMAIL_FORMAT'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_ACCOUNT_LOCKED'
  | 'AUTH_EMAIL_NOT_VERIFIED'
  | 'AUTH_SOCIAL_PROVIDER_MISMATCH'
  | 'AUTH_REFRESH_INVALID';

export const DEFAULT_ADMIN_EMAIL = 'petbhaibd@gmail.com';

export const normalizedDefaultAdminEmail = DEFAULT_ADMIN_EMAIL.toLowerCase();

export const ADMIN_EMAIL_ALLOWLIST = new Set([
  ...(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0),
  normalizedDefaultAdminEmail,
]);

// Email validation regex
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize string input
export const sanitizeString = (str: string): string => {
  return str.trim().slice(0, 500); // Limit length and trim whitespace
};

export const normalizeEmail = (email: unknown): string => {
  if (typeof email !== 'string') {
    return '';
  }

  return sanitizeString(email).toLowerCase();
};

export const isRecordObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export const ensureUserCollections = (user: User): void => {
  if (!Array.isArray(user.wishlist)) user.wishlist = [];
  if (!Array.isArray(user.orderHistory)) user.orderHistory = [];
  if (!Array.isArray(user.favorites)) user.favorites = [];
};

export type UserAuthMetadata = User & {
  tokenVersion?: number;
  refreshTokenHash?: string;
  refreshTokenExpiresAt?: string;
  emailVerified?: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: string;
  socialProvider?: string;
  socialProviderId?: string;
};

export const userWithAuthMetadata = (user: User): UserAuthMetadata => {
  return user as UserAuthMetadata;
};

export const getRoleByEmail = (email: string, emailVerified: boolean): 'super_admin' | 'customer' => {
  if (!emailVerified) return 'customer';
  const normalizedEmail = normalizeEmail(email);
  return ADMIN_EMAIL_ALLOWLIST.has(normalizedEmail) ? 'super_admin' : 'customer';
};

export const syncRoleByEmail = (user: User): boolean => {
  if (typeof user.email !== 'string' || user.email.trim().length === 0) {
    return false;
  }

  const isVerified = Boolean(userWithAuthMetadata(user).emailVerified);
  const expectedRole = getRoleByEmail(user.email, isVerified);
  if (user.role === expectedRole) {
    return false;
  }

  user.role = expectedRole;
  return true;
};

// Password strength validation
export const isStrongPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Compare password with hash
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Helper to remove password from user object
export const sanitizeUser = (user: User): Omit<User, 'password'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    password: _p,
    refreshTokenHash: _r,
    refreshTokenExpiresAt: _re,
    emailVerificationTokenHash: _evh,
    emailVerificationExpiresAt: _eve,
    tokenVersion: _tv,
    ...safeUser
  } = user as UserAuthMetadata;
  return safeUser;
};

export const canAccessUser = (req: AuthRequest, userId: number | string): boolean => {
  if (!req.user) return false;
  const requesterId = String(req.user.id);
  return String(requesterId) === String(userId) || !!req.user.isAdmin;
};

export const persistChanges = (res: any): boolean => {
  db.write();
  return true;
};

export const sendAuthError = (
  res: any,
  status: number,
  code: AuthErrorCode,
  message: string,
  details?: Record<string, unknown>
) => {
  return res.status(status).json({
    code,
    message,
    ...(details ? { details } : {}),
  });
};

export const getClientIp = (req: AuthRequest): string => {
  const rawIp = req.ip || req.socket.remoteAddress || 'unknown';
  return rawIp.trim().toLowerCase();
};

export const getLoginAttemptKey = (email: string, req: AuthRequest): string => {
  return `${normalizeEmail(email)}|${getClientIp(req)}`;
};

export const nowMs = (): number => Date.now();

export const checkIpEmailLock = (
  email: string,
  req: AuthRequest
): { locked: boolean; retryAfterMs: number } => {
  const key = getLoginAttemptKey(email, req);
  const record = loginAttemptTracker.get(key);
  if (!record) return { locked: false, retryAfterMs: 0 };

  const now = nowMs();
  if (record.lockUntil > now) {
    return { locked: true, retryAfterMs: record.lockUntil - now };
  }

  if (now - record.firstAttemptAt > LOCKOUT_WINDOW_MS) {
    loginAttemptTracker.delete(key);
    return { locked: false, retryAfterMs: 0 };
  }

  return { locked: false, retryAfterMs: 0 };
};

export const recordFailedLogin = (email: string, req: AuthRequest): void => {
  const key = getLoginAttemptKey(email, req);
  const now = nowMs();
  const current = loginAttemptTracker.get(key);

  if (!current || now - current.firstAttemptAt > LOCKOUT_WINDOW_MS) {
    loginAttemptTracker.set(key, {
      attempts: 1,
      firstAttemptAt: now,
      lockUntil: 0,
    });
    return;
  }

  const nextAttempts = current.attempts + 1;
  loginAttemptTracker.set(key, {
    attempts: nextAttempts,
    firstAttemptAt: current.firstAttemptAt,
    lockUntil: nextAttempts >= LOCKOUT_THRESHOLD ? now + LOCKOUT_DURATION_MS : 0,
  });
};

export const clearFailedLogin = (email: string, req: AuthRequest): void => {
  loginAttemptTracker.delete(getLoginAttemptKey(email, req));
};

export const hashToken = (value: string): string => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const getTokenVersion = (user: User): number => {
  const raw = userWithAuthMetadata(user).tokenVersion;
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
};

export const setTokenVersion = (user: User, nextValue: number): void => {
  userWithAuthMetadata(user).tokenVersion = Math.max(0, Math.floor(nextValue));
};

export const setRefreshTokenState = (user: User, refreshToken: string): void => {
  const rawUser = userWithAuthMetadata(user);
  rawUser.refreshTokenHash = hashToken(refreshToken);
  rawUser.refreshTokenExpiresAt = new Date(nowMs() + 30 * 24 * 60 * 60 * 1000).toISOString();
};

export const clearRefreshTokenState = (user: User): void => {
  const rawUser = userWithAuthMetadata(user);
  delete rawUser.refreshTokenHash;
  delete rawUser.refreshTokenExpiresAt;
};

export const issueAuthSession = (
  user: User
): {
  accessToken: string;
  refreshToken: string;
} => {
  const tokenVersion = getTokenVersion(user);
  const basePayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    isPlusMember: user.isPlusMember,
    isAdmin: user.role === 'super_admin' || user.role === 'store_manager',
    role: user.role,
  };
  const accessToken = generateAccessToken({
    ...basePayload,
    tokenType: 'access',
  });
  const refreshToken = generateRefreshToken(basePayload, tokenVersion);
  setRefreshTokenState(user, refreshToken);
  return { accessToken, refreshToken };
};

export const assignNewEmailVerification = (user: User): string => {
  const token = generateVerificationToken();
  const rawUser = userWithAuthMetadata(user);
  rawUser.emailVerified = false;
  rawUser.emailVerificationTokenHash = hashToken(token);
  rawUser.emailVerificationExpiresAt = new Date(
    nowMs() + EMAIL_VERIFICATION_TOKEN_TTL_MS
  ).toISOString();
  return token;
};

export const isEmailVerified = (user: User): boolean => {
  return Boolean(userWithAuthMetadata(user).emailVerified);
};

export const getNextUserId = (): number => {
  const numericIds = db.users
    .filter((user): user is User => isRecordObject(user))
    .map((user) => Number(user.id))
    .filter((id) => Number.isFinite(id) && id > 0);
  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  return maxId + 1;
};

export const generateRecordId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

export const petCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    type: z.enum(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'other']),
    gender: z.enum(['male', 'female', 'unknown']),
    breed: z.string().trim().max(80).optional(),
    weight: z.number().positive().max(250).optional(),
    activityLevel: z.enum(['low', 'medium', 'high']),
    birthDate: z.string().datetime().optional(),
  })
  .strict();

export const petUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    gender: z.enum(['male', 'female', 'unknown']).optional(),
    breed: z.string().trim().max(80).optional(),
    weight: z.number().positive().max(250).optional(),
    activityLevel: z.enum(['low', 'medium', 'high']).optional(),
    birthDate: z.string().optional(),
  })
  .strict();

export const petWeightSchema = z
  .object({
    weight: z.number().positive().max(250),
  })
  .strict();

export const reminderCreateSchema = z
  .object({
    petId: z.string().trim().min(3).max(80),
    medicineName: z.string().trim().min(2).max(100),
    dosage: z.string().trim().min(1).max(100),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
    customDays: z.number().int().min(1).max(90).optional(),
    startDate: z.string().datetime(),
    nextDueDate: z.string().datetime(),
    notes: z.string().trim().max(300).optional(),
    isActive: z.boolean(),
    notificationEnabled: z.boolean(),
  })
  .strict();

export const reminderUpdateSchema = z
  .object({
    medicineName: z.string().trim().min(2).max(100).optional(),
    dosage: z.string().trim().min(1).max(100).optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
    customDays: z.number().int().min(1).max(90).optional(),
    startDate: z.string().optional(),
    nextDueDate: z.string().optional(),
    notes: z.string().trim().max(300).optional(),
    isActive: z.boolean().optional(),
    notificationEnabled: z.boolean().optional(),
    lastGivenDate: z.string().optional(),
  })
  .strict();

export const shippingAddressSchema = z
  .object({
    fullName: z.string().trim().max(120).optional(),
    address: z.string().trim().max(240).optional(),
    city: z.string().trim().max(80).optional(),
    phone: z.string().trim().max(30).optional(),
  })
  .strict();

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    profilePictureUrl: z.string().trim().max(5000).optional(),
    phone: z.string().trim().max(30).optional(),
    bio: z.string().trim().max(500).optional(),
    defaultShippingAddress: shippingAddressSchema.optional(),
  })
  .strict();

export const ensurePetCollections = (user: User): void => {
  if (!Array.isArray(user.petProfiles)) {
    user.petProfiles = [];
  }

  if (!Array.isArray(user.medicineReminders)) {
    user.medicineReminders = [];
  }
};

export const parseUserFromParam = (req: AuthRequest, res: any): User | null => {
  const userId = Number(req.params.id);
  if (Number.isNaN(userId)) {
    res.status(400).json({ message: 'Invalid user ID' });
    return null;
  }

  if (!canAccessUser(req, userId)) {
    res.status(403).json({ message: 'Forbidden' });
    return null;
  }

  const user = db.users.find((record) => Number(record.id) === userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return null;
  }

  ensurePetCollections(user);
  return user;
};

export const calculateNextDueDate = (
  frequency: MedicineReminderRecord['frequency'],
  customDays?: number
): string => {
  const nextDate = new Date();

  if (frequency === 'daily') {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (frequency === 'weekly') {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (frequency === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else {
    nextDate.setDate(nextDate.getDate() + Math.max(1, customDays || 1));
  }

  return nextDate.toISOString();
};

// Login
