import { Router } from 'express';
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

const router = Router();

// Password hashing configuration
const SALT_ROUNDS = 12;
const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const loginAttemptTracker = new Map<
  string,
  { attempts: number; firstAttemptAt: number; lockUntil: number }
>();

type AuthErrorCode =
  | 'AUTH_MISSING_EMAIL'
  | 'AUTH_INVALID_EMAIL_FORMAT'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_ACCOUNT_LOCKED'
  | 'AUTH_EMAIL_NOT_VERIFIED'
  | 'AUTH_SOCIAL_PROVIDER_MISMATCH'
  | 'AUTH_REFRESH_INVALID';

const DEFAULT_ADMIN_EMAIL = 'petbhaibd@gmail.com';

const normalizedDefaultAdminEmail = DEFAULT_ADMIN_EMAIL.toLowerCase();

const ADMIN_EMAIL_ALLOWLIST = new Set([
  ...(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0),
  normalizedDefaultAdminEmail,
]);

// Email validation regex
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize string input
const sanitizeString = (str: string): string => {
  return str.trim().slice(0, 500); // Limit length and trim whitespace
};

const normalizeEmail = (email: unknown): string => {
  if (typeof email !== 'string') {
    return '';
  }

  return sanitizeString(email).toLowerCase();
};

const isRecordObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const ensureUserCollections = (user: User): void => {
  if (!Array.isArray(user.wishlist)) user.wishlist = [];
  if (!Array.isArray(user.orderHistory)) user.orderHistory = [];
  if (!Array.isArray(user.favorites)) user.favorites = [];
};

type UserAuthMetadata = User & {
  tokenVersion?: number;
  refreshTokenHash?: string;
  refreshTokenExpiresAt?: string;
  emailVerified?: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: string;
  socialProvider?: string;
  socialProviderId?: string;
};

const userWithAuthMetadata = (user: User): UserAuthMetadata => {
  return user as UserAuthMetadata;
};

const getRoleByEmail = (email: string, emailVerified: boolean): 'super_admin' | 'customer' => {
  if (!emailVerified) return 'customer';
  const normalizedEmail = normalizeEmail(email);
  return ADMIN_EMAIL_ALLOWLIST.has(normalizedEmail) ? 'super_admin' : 'customer';
};

const syncRoleByEmail = (user: User): boolean => {
  if (typeof user.email !== 'string' || user.email.trim().length === 0) {
    return false;
  }

  const isVerified = Boolean(userWithAuthMetadata(user!).emailVerified);
  const expectedRole = getRoleByEmail(user.email, isVerified);
  if (user.role === expectedRole) {
    return false;
  }

  user.role = expectedRole;
  return true;
};

// Password strength validation
const isStrongPassword = (password: string): { valid: boolean; message?: string } => {
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
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Compare password with hash
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Helper to remove password from user object
const sanitizeUser = (user: User): Omit<User, 'password'> => {
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

const canAccessUser = (req: AuthRequest, userId: number | string): boolean => {
  if (!req.user) return false;
  const requesterId = String(req.user.id);
  return String(requesterId) === String(userId) || !!req.user.isAdmin;
};

const persistChanges = (res: any): boolean => {
  db.write();
  return true;
};

const sendAuthError = (
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

const getClientIp = (req: AuthRequest): string => {
  const rawIp = req.ip || req.socket.remoteAddress || 'unknown';
  return rawIp.trim().toLowerCase();
};

const getLoginAttemptKey = (email: string, req: AuthRequest): string => {
  return `${normalizeEmail(email)}|${getClientIp(req)}`;
};

const nowMs = (): number => Date.now();

const checkIpEmailLock = (
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

const recordFailedLogin = (email: string, req: AuthRequest): void => {
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

const clearFailedLogin = (email: string, req: AuthRequest): void => {
  loginAttemptTracker.delete(getLoginAttemptKey(email, req));
};

const hashToken = (value: string): string => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const getTokenVersion = (user: User): number => {
  const raw = userWithAuthMetadata(user!).tokenVersion;
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
};

const setTokenVersion = (user: User, nextValue: number): void => {
  userWithAuthMetadata(user!).tokenVersion = Math.max(0, Math.floor(nextValue));
};

const setRefreshTokenState = (user: User, refreshToken: string): void => {
  const rawUser = userWithAuthMetadata(user!);
  rawUser.refreshTokenHash = hashToken(refreshToken);
  rawUser.refreshTokenExpiresAt = new Date(nowMs() + 30 * 24 * 60 * 60 * 1000).toISOString();
};

const clearRefreshTokenState = (user: User): void => {
  const rawUser = userWithAuthMetadata(user!);
  delete rawUser.refreshTokenHash;
  delete rawUser.refreshTokenExpiresAt;
};

const issueAuthSession = (
  user: User
): {
  accessToken: string;
  refreshToken: string;
} => {
  const tokenVersion = getTokenVersion(user);
  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    name: user.name,
    isPlusMember: user.isPlusMember,
    isAdmin: user.role === 'super_admin',
  });
  const refreshToken = generateRefreshToken(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      isPlusMember: user.isPlusMember,
      isAdmin: user.role === 'super_admin',
    },
    tokenVersion
  );
  setRefreshTokenState(user, refreshToken);
  return { accessToken, refreshToken };
};

const assignNewEmailVerification = (user: User): string => {
  const token = generateVerificationToken();
  const rawUser = userWithAuthMetadata(user!);
  rawUser.emailVerified = false;
  rawUser.emailVerificationTokenHash = hashToken(token);
  rawUser.emailVerificationExpiresAt = new Date(
    nowMs() + EMAIL_VERIFICATION_TOKEN_TTL_MS
  ).toISOString();
  return token;
};

const isEmailVerified = (user: User): boolean => {
  return Boolean(userWithAuthMetadata(user!).emailVerified);
};

const getNextUserId = (): number => {
  const numericIds = db.users
    .filter((user): user is User => isRecordObject(user))
    .map((user) => Number(user.id))
    .filter((id) => Number.isFinite(id) && id > 0);
  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  return maxId + 1;
};

const generateRecordId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

const petCreateSchema = z
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

const petUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    gender: z.enum(['male', 'female', 'unknown']).optional(),
    breed: z.string().trim().max(80).optional(),
    weight: z.number().positive().max(250).optional(),
    activityLevel: z.enum(['low', 'medium', 'high']).optional(),
    birthDate: z.string().datetime().optional(),
  })
  .strict();

const petWeightSchema = z
  .object({
    weight: z.number().positive().max(250),
  })
  .strict();

const reminderCreateSchema = z
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

const reminderUpdateSchema = z
  .object({
    medicineName: z.string().trim().min(2).max(100).optional(),
    dosage: z.string().trim().min(1).max(100).optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
    customDays: z.number().int().min(1).max(90).optional(),
    startDate: z.string().datetime().optional(),
    nextDueDate: z.string().datetime().optional(),
    notes: z.string().trim().max(300).optional(),
    isActive: z.boolean().optional(),
    notificationEnabled: z.boolean().optional(),
    lastGivenDate: z.string().datetime().optional(),
  })
  .strict();

const shippingAddressSchema = z
  .object({
    fullName: z.string().trim().max(120).optional(),
    address: z.string().trim().max(240).optional(),
    city: z.string().trim().max(80).optional(),
    phone: z.string().trim().max(30).optional(),
  })
  .strict();

const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    profilePictureUrl: z.string().trim().max(5000).optional(),
    phone: z.string().trim().min(6).max(30).optional(),
    bio: z.string().trim().max(500).optional(),
    defaultShippingAddress: shippingAddressSchema.optional(),
  })
  .strict();

const ensurePetCollections = (user: User): void => {
  if (!Array.isArray(user.petProfiles)) {
    user.petProfiles = [];
  }

  if (!Array.isArray(user.medicineReminders)) {
    user.medicineReminders = [];
  }
};

const parseUserFromParam = (req: AuthRequest, res: any): User | null => {
  const userId = Number(req.params.id);
  if (!userId) {
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

const calculateNextDueDate = (
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
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input types' });
    }

    const sanitizedEmail = sanitizeString(email).toLowerCase();

    if (!isValidEmail(sanitizedEmail)) {
      return sendAuthError(res, 400, 'AUTH_INVALID_EMAIL_FORMAT', 'Invalid email format');
    }

    const ipEmailLock = checkIpEmailLock(sanitizedEmail, req);
    if (ipEmailLock.locked) {
      return sendAuthError(res, 429, 'AUTH_ACCOUNT_LOCKED', 'Too many failed login attempts', {
        retryAfterMs: ipEmailLock.retryAfterMs,
      });
    }

    const user = db.users.find(
      (u) => normalizeEmail((u as User | undefined)?.email) === sanitizedEmail
    );

    if (!user) {
      recordFailedLogin(sanitizedEmail, req);
      // Use consistent error message to prevent user enumeration
      return sendAuthError(res, 401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Check password - support both hashed and legacy plain text (for migration)
    const isLegacyPlainTextPassword = Boolean(user.password && !user.password.startsWith('$2'));
    const isValidPassword = user.password?.startsWith('$2')
      ? await comparePassword(password, user.password)
      : user.password === password;

    if (!isValidPassword) {
      recordFailedLogin(sanitizedEmail, req);
      auditLog('FAILED_LOGIN', undefined, { email: sanitizedEmail });
      return sendAuthError(res, 401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!isEmailVerified(user)) {
      return sendAuthError(
        res,
        403,
        'AUTH_EMAIL_NOT_VERIFIED',
        'Please verify your email before logging in.'
      );
    }

    clearFailedLogin(sanitizedEmail, req);

    if (isLegacyPlainTextPassword) {
      user.password = await hashPassword(password);
      persistChanges(res);
      auditLog('LEGACY_PASSWORD_MIGRATED', user.id, { email: sanitizedEmail });
    }

    if (syncRoleByEmail(user)) {
      persistChanges(res);
      auditLog('USER_ROLE_SYNCED', user.id, { email: sanitizedEmail, role: user.role });
    }

    if (!user.createdAt) {
      user.createdAt = new Date().toISOString();
      persistChanges(res);
    }

    const { accessToken, refreshToken } = issueAuthSession(user!);
    persistChanges(res);

    auditLog('LOGIN_SUCCESS', user.id, { email: sanitizedEmail });

    return res.json({
      user: sanitizeUser(user!),
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'An error occurred during login' });
  }
});

// Signup
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input types' });
    }

    const sanitizedName = sanitizeString(name);
    const sanitizedEmail = sanitizeString(email).toLowerCase();

    if (sanitizedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    if (!isValidEmail(sanitizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password strength
    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    if (db.users.some((u) => normalizeEmail((u as User | undefined)?.email) === sanitizedEmail)) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    const newUser: User = {
      id: String(getNextUserId()),
      name: sanitizedName,
      email: sanitizedEmail,
      createdAt: new Date().toISOString(),
      password: hashedPassword,
      role: getRoleByEmail(sanitizedEmail, false) as any,
      wishlist: [],
      orderHistory: [],
      favorites: [],
      isPlusMember: false,
    };

    const emailVerificationToken = assignNewEmailVerification(newUser);
    setTokenVersion(newUser, 0);

    db.users.push(newUser);
    const { accessToken, refreshToken } = issueAuthSession(newUser);
    persistChanges(res);

    auditLog('USER_SIGNUP', newUser.id, { email: sanitizedEmail });

    res.status(201).json({
      user: sanitizeUser(newUser),
      token: accessToken,
      refreshToken,
      emailVerificationRequired: true,
      ...(process.env.NODE_ENV !== 'production' && { emailVerificationToken }),
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'An error occurred during signup' });
  }
});

// Firebase Admin — initialised lazily so we don't crash when credentials are absent
let firebaseAdminApp: import('firebase-admin').app.App | null = null;
const getFirebaseAdmin = async (): Promise<import('firebase-admin').app.App | null> => {
  if (firebaseAdminApp) return firebaseAdminApp;
  try {
    const admin = await import('firebase-admin');
    if (admin.apps.length > 0) {
      firebaseAdminApp = admin.apps[0]!;
    } else {
      // If GOOGLE_APPLICATION_CREDENTIALS is set, use it; otherwise use projectId-only init
      const projectId = process.env.FIREBASE_PROJECT_ID;
      firebaseAdminApp = admin.initializeApp(projectId ? { projectId } : undefined);
    }
    return firebaseAdminApp;
  } catch (err) {
    console.warn('Firebase Admin init failed (social token verification disabled):', err);
    return null;
  }
};

/**
 * Verify a Firebase ID token and return the decoded claims.
 * Returns null when verification cannot be performed (missing SDK / credentials).
 */
const verifyFirebaseToken = async (
  idToken: string
): Promise<{ uid: string; email?: string } | null> => {
  if (!idToken) return null;
  try {
    const app = await getFirebaseAdmin();
    if (!app) return null;
    const admin = await import('firebase-admin');
    const decoded = await admin.auth(app).verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    console.error('Firebase token verification failed:', err);
    return null;
  }
};

// Social login (Google/Firebase)
router.post('/social', authLimiter, async (req, res) => {
  try {
    const payload = isRecordObject(req.body) ? req.body : {};
    const name = typeof payload.name === 'string' ? payload.name : '';
    const email = typeof payload.email === 'string' ? payload.email : '';
    const photoUrl = typeof payload.photoUrl === 'string' ? payload.photoUrl : undefined;
    const firebaseToken =
      typeof payload.firebaseToken === 'string' ? payload.firebaseToken.trim() : '';
    let providerUserId =
      typeof payload.providerUserId === 'string' ? sanitizeString(payload.providerUserId) : '';

    // ── Firebase ID token verification ──
    // If the client sent a Firebase ID token, verify it server-side.
    if (firebaseToken) {
      const verified = await verifyFirebaseToken(firebaseToken);
      if (verified) {
        // Trust the uid from the verified token over the client-supplied one
        providerUserId = verified.uid;
        // If backend email doesn't match the verified token, warn but allow
        // (the route already validates the email format below)
      } else {
        console.warn(
          'Firebase token provided but could not be verified — proceeding without trust'
        );
      }
    }

    if (!email || typeof email !== 'string') {
      return sendAuthError(res, 400, 'AUTH_MISSING_EMAIL', 'Email is required');
    }

    const sanitizedEmail = sanitizeString(email).toLowerCase();
    if (!isValidEmail(sanitizedEmail)) {
      return sendAuthError(res, 400, 'AUTH_INVALID_EMAIL_FORMAT', 'Invalid email format');
    }

    const sanitizedName =
      typeof name === 'string' && sanitizeString(name).length >= 2
        ? sanitizeString(name)
        : sanitizedEmail.split('@')[0];

    let user = db.users.find(
      (u) => normalizeEmail((u as User | undefined)?.email) === sanitizedEmail
    );

    if (user) {
      let shouldPersist = false;
      ensureUserCollections(user);
      user.name = sanitizedName;
      shouldPersist = true;

      if (!user.createdAt) {
        user.createdAt = new Date().toISOString();
        shouldPersist = true;
      }

      const rawUser = userWithAuthMetadata(user!);
      const existingProviderUserId =
        typeof rawUser.socialProviderId === 'string' ? rawUser.socialProviderId : '';

      if (existingProviderUserId && providerUserId && existingProviderUserId !== providerUserId) {
        return sendAuthError(
          res,
          409,
          'AUTH_SOCIAL_PROVIDER_MISMATCH',
          'This email is linked to a different Google account.'
        );
      }

      if (!existingProviderUserId && providerUserId) {
        rawUser.socialProviderId = providerUserId;
        rawUser.socialProvider = 'google';
        shouldPersist = true;
      }

      rawUser.emailVerified = true;

      if (typeof photoUrl === 'string' && /^https?:\/\//.test(photoUrl)) {
        user.profilePictureUrl = photoUrl.slice(0, 500);
        shouldPersist = true;
      }
      if (syncRoleByEmail(user)) {
        shouldPersist = true;
      }
      if (shouldPersist) {
        persistChanges(res);
      }
    } else {
      user = {
        id: String(getNextUserId()),
        name: sanitizedName,
        email: sanitizedEmail,
        createdAt: new Date().toISOString(),
        role: getRoleByEmail(sanitizedEmail, true) as any,
        profilePictureUrl:
          typeof photoUrl === 'string' && /^https?:\/\//.test(photoUrl)
            ? photoUrl.slice(0, 500)
            : undefined,
        wishlist: [],
        orderHistory: [],
        favorites: [],
        isPlusMember: false,
      };

      const rawUser = userWithAuthMetadata(user!);
      rawUser.emailVerified = true;
      rawUser.socialProvider = 'google';
      if (providerUserId) {
        rawUser.socialProviderId = providerUserId;
      }
      setTokenVersion(user!, 0);

      db.users.push(user!);
      persistChanges(res);
      auditLog('USER_SOCIAL_SIGNUP', user!.id, { email: sanitizedEmail });
    }

    const { accessToken, refreshToken } = issueAuthSession(user!);
    persistChanges(res);

    auditLog('SOCIAL_LOGIN_SUCCESS', user!.id, { email: sanitizedEmail });
    return res.json({ user: sanitizeUser(user!), token: accessToken, refreshToken });
  } catch (error) {
    console.error('Social login error:', error);
    return res.status(500).json({ message: 'An error occurred during social login' });
  }
});

router.post('/refresh', authLimiter, async (req, res) => {
  try {
    const refreshToken =
      typeof req.body?.refreshToken === 'string' ? req.body.refreshToken.trim() : '';

    if (!refreshToken) {
      return sendAuthError(res, 401, 'AUTH_REFRESH_INVALID', 'Refresh token is required');
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return sendAuthError(res, 401, 'AUTH_REFRESH_INVALID', 'Invalid or expired refresh token');
    }

    const user = db.users.find((u) => Number(u.id) === Number(decoded.id));
    if (!user) {
      return sendAuthError(res, 401, 'AUTH_REFRESH_INVALID', 'Invalid refresh session');
    }

    const rawUser = userWithAuthMetadata(user!);
    const storedHash = typeof rawUser.refreshTokenHash === 'string' ? rawUser.refreshTokenHash : '';
    const storedExpiry =
      typeof rawUser.refreshTokenExpiresAt === 'string'
        ? Date.parse(rawUser.refreshTokenExpiresAt)
        : NaN;
    const tokenVersion = getTokenVersion(user);

    if (!storedHash || storedHash !== hashToken(refreshToken)) {
      return sendAuthError(res, 401, 'AUTH_REFRESH_INVALID', 'Refresh token revoked');
    }

    if (!Number.isFinite(storedExpiry) || storedExpiry <= nowMs()) {
      clearRefreshTokenState(user);
      persistChanges(res);
      return sendAuthError(res, 401, 'AUTH_REFRESH_INVALID', 'Refresh token expired');
    }

    if (decoded.tokenVersion !== tokenVersion) {
      return sendAuthError(res, 401, 'AUTH_REFRESH_INVALID', 'Refresh token version mismatch');
    }

    const { accessToken, refreshToken: rotatedRefreshToken } = issueAuthSession(user!);
    persistChanges(res);

    return res.json({
      token: accessToken,
      refreshToken: rotatedRefreshToken,
      user: sanitizeUser(user!),
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Failed to refresh session' });
  }
});

router.post('/logout', requireAuth, async (req: AuthRequest, res) => {
  const requesterId = Number(req.user?.id);
  if (!Number.isFinite(requesterId)) {
    return res.status(400).json({ message: 'Invalid session' });
  }

  const user = db.users.find((u) => Number(u.id) === requesterId);
  if (!user) {
    return res.status(200).json({ success: true });
  }

  setTokenVersion(user, getTokenVersion(user) + 1);
  clearRefreshTokenState(user);
  persistChanges(res);

  auditLog('LOGOUT_SUCCESS', user.id, { email: user.email });
  return res.status(200).json({ success: true });
});

router.post('/verify-email', authLimiter, async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';

    if (!email || !token) {
      return res.status(400).json({ message: 'Email and token are required' });
    }

    const user = db.users.find((u) => normalizeEmail((u as User | undefined)?.email) === email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const rawUser = userWithAuthMetadata(user!);
    const tokenHash =
      typeof rawUser.emailVerificationTokenHash === 'string'
        ? rawUser.emailVerificationTokenHash
        : '';
    const expiresAt =
      typeof rawUser.emailVerificationExpiresAt === 'string'
        ? Date.parse(rawUser.emailVerificationExpiresAt)
        : NaN;

    if (!tokenHash || hashToken(token) !== tokenHash) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    if (!Number.isFinite(expiresAt) || expiresAt <= nowMs()) {
      return res.status(400).json({ message: 'Verification token expired' });
    }

    rawUser.emailVerified = true;
    delete rawUser.emailVerificationTokenHash;
    delete rawUser.emailVerificationExpiresAt;
    persistChanges(res);

    return res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ message: 'Failed to verify email' });
  }
});

router.post('/resend-verification', authLimiter, async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = db.users.find((u) => normalizeEmail((u as User | undefined)?.email) === email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isEmailVerified(user)) {
      return res.status(200).json({ message: 'Email already verified' });
    }

    const token = assignNewEmailVerification(user);
    persistChanges(res);

    return res.status(200).json({
      message: 'Verification token generated',
      ...(process.env.NODE_ENV !== 'production' && { emailVerificationToken: token }),
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ message: 'Failed to resend verification token' });
  }
});

export default router;
