import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db';
import type { MedicineReminderRecord, PetProfileRecord, User } from '../types';
import { AuthRequest, generateToken, requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { auditLog } from '../middleware/logger';

const router = Router();

// Password hashing configuration
const SALT_ROUNDS = 12;

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

const getRoleByEmail = (email: string): 'admin' | 'customer' => {
  const normalizedEmail = normalizeEmail(email);
  return ADMIN_EMAIL_ALLOWLIST.has(normalizedEmail) ? 'admin' : 'customer';
};

const syncRoleByEmail = (user: User): boolean => {
  if (typeof user.email !== 'string' || user.email.trim().length === 0) {
    return false;
  }

  const expectedRole = getRoleByEmail(user.email);
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
  const { password: _p, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const canAccessUser = (req: AuthRequest, userId: number): boolean => {
  if (!req.user) return false;
  const requesterId = Number(req.user.id);
  return requesterId === userId || !!req.user.isAdmin;
};

const persistChanges = (res: any): boolean => {
  db.write();
  return true;
};

const getNextUserId = (): number => {
  const numericIds = db.users
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

const ensurePetCollections = (user: User): void => {
  if (!Array.isArray(user.petProfiles)) {
    user.petProfiles = [];
  }

  if (!Array.isArray(user.medicineReminders)) {
    user.medicineReminders = [];
  }
};

const parseUserFromParam = (req: AuthRequest, res: any): User | null => {
  const userId = parseInt(req.params.id, 10);
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
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = db.users.find((u) => normalizeEmail(u.email) === sanitizedEmail);

    if (!user) {
      // Use consistent error message to prevent user enumeration
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password - support both hashed and legacy plain text (for migration)
    const isValidPassword = user.password?.startsWith('$2')
      ? await comparePassword(password, user.password)
      : user.password === password;

    if (!isValidPassword) {
      auditLog('FAILED_LOGIN', undefined, { email: sanitizedEmail });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (syncRoleByEmail(user)) {
      persistChanges(res);
      auditLog('USER_ROLE_SYNCED', user.id, { email: sanitizedEmail, role: user.role });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      isPlusMember: user.isPlusMember,
      isAdmin: user.role === 'admin',
    });

    auditLog('LOGIN_SUCCESS', user.id, { email: sanitizedEmail });

    return res.json({
      user: sanitizeUser(user),
      token,
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

    if (db.users.some((u) => normalizeEmail(u.email) === sanitizedEmail)) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    const newUser: User = {
      id: db.users.length + 1,
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword,
      role: getRoleByEmail(sanitizedEmail),
      wishlist: [],
      orderHistory: [],
      favorites: [],
      isPlusMember: false,
    };

    db.users.push(newUser);
    persistChanges(res);

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      isPlusMember: newUser.isPlusMember,
      isAdmin: newUser.role === 'admin',
    });

    auditLog('USER_SIGNUP', newUser.id, { email: sanitizedEmail });

    res.status(201).json({
      user: sanitizeUser(newUser),
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'An error occurred during signup' });
  }
});

// Social login (Google/Firebase)
router.post('/social', authLimiter, (req, res) => {
  try {
    const { name, email, photoUrl } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    const sanitizedEmail = sanitizeString(email).toLowerCase();
    if (!isValidEmail(sanitizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const sanitizedName =
      typeof name === 'string' && sanitizeString(name).length >= 2
        ? sanitizeString(name)
        : sanitizedEmail.split('@')[0];

    let user = db.users.find((u) => normalizeEmail(u.email) === sanitizedEmail);

    if (user) {
      let shouldPersist = false;
      user.name = sanitizedName;
      shouldPersist = true;
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
        id: getNextUserId(),
        name: sanitizedName,
        email: sanitizedEmail,
        role: getRoleByEmail(sanitizedEmail),
        profilePictureUrl:
          typeof photoUrl === 'string' && /^https?:\/\//.test(photoUrl)
            ? photoUrl.slice(0, 500)
            : undefined,
        wishlist: [],
        orderHistory: [],
        favorites: [],
        isPlusMember: false,
      };

      db.users.push(user);
      persistChanges(res);
      auditLog('USER_SOCIAL_SIGNUP', user.id, { email: sanitizedEmail });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      isPlusMember: user.isPlusMember,
      isAdmin: user.role === 'admin',
    });

    auditLog('SOCIAL_LOGIN_SUCCESS', user.id, { email: sanitizedEmail });
    return res.json({ user: sanitizeUser(user), token });
  } catch (error) {
    console.error('Social login error:', error);
    return res.status(500).json({ message: 'An error occurred during social login' });
  }
});

// Update Profile
router.put('/:id', requireAuth, (req: AuthRequest, res) => {
  const userId = parseInt(req.params.id);
  const { name, profilePictureUrl } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const userIndex = db.users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  const updatedUser = { ...db.users[userIndex] };
  if (name && typeof name === 'string') {
    updatedUser.name = sanitizeString(name);
  }
  if (profilePictureUrl && typeof profilePictureUrl === 'string') {
    // Basic URL validation
    if (profilePictureUrl.startsWith('http://') || profilePictureUrl.startsWith('https://')) {
      updatedUser.profilePictureUrl = profilePictureUrl.slice(0, 500);
    }
  }

  db.users[userIndex] = updatedUser;
  persistChanges(res);

  auditLog('PROFILE_UPDATE', userId, { fields: Object.keys(req.body) });
  res.json(sanitizeUser(updatedUser));
});

// Add to Wishlist
router.post('/:id/wishlist', requireAuth, (req: AuthRequest, res) => {
  const userId = parseInt(req.params.id);
  const { productId } = req.body;

  if (isNaN(userId) || typeof productId !== 'number') {
    return res.status(400).json({ message: 'Invalid user ID or product ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = db.users.find((u) => u.id === userId);

  if (user) {
    // Initialize wishlist if not exists
    if (!user.wishlist) user.wishlist = [];
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      persistChanges(res);
    }
    res.json(sanitizeUser(user));
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Remove from Wishlist
router.delete('/:id/wishlist/:productId', requireAuth, (req: AuthRequest, res) => {
  const userId = parseInt(req.params.id);
  const productId = parseInt(req.params.productId);

  if (isNaN(userId) || isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid user ID or product ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = db.users.find((u) => u.id === userId);

  if (user) {
    // Initialize wishlist if not exists
    if (!user.wishlist) user.wishlist = [];
    user.wishlist = user.wishlist.filter((id) => id !== productId);
    persistChanges(res);
    res.json(sanitizeUser(user));
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Add to Favorites (Animals)
router.post('/:id/favorites', requireAuth, (req: AuthRequest, res) => {
  const userId = parseInt(req.params.id);
  const { animalId } = req.body;

  if (isNaN(userId) || typeof animalId !== 'number') {
    return res.status(400).json({ message: 'Invalid user ID or animal ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = db.users.find((u) => u.id === userId);

  if (user) {
    // Initialize favorites if not exists
    if (!user.favorites) user.favorites = [];
    if (!user.favorites.includes(animalId)) {
      user.favorites.push(animalId);
      persistChanges(res);
    }
    res.json(sanitizeUser(user));
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Remove from Favorites
router.delete('/:id/favorites/:animalId', requireAuth, (req: AuthRequest, res) => {
  const userId = parseInt(req.params.id);
  const animalId = parseInt(req.params.animalId);

  if (isNaN(userId) || isNaN(animalId)) {
    return res.status(400).json({ message: 'Invalid user ID or animal ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = db.users.find((u) => u.id === userId);

  if (user) {
    // Initialize favorites if not exists
    if (!user.favorites) user.favorites = [];
    user.favorites = user.favorites.filter((id) => id !== animalId);
    persistChanges(res);
    res.json(sanitizeUser(user));
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Subscribe to Plus
router.post('/:id/subscribe', requireAuth, (req: AuthRequest, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = db.users.find((u) => u.id === userId);

  if (user) {
    user.isPlusMember = true;
    persistChanges(res);
    auditLog('PLUS_SUBSCRIPTION', userId, { status: 'subscribed' });
    res.json(sanitizeUser(user));
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Add to Order History
router.post('/:id/orders', requireAuth, (req: AuthRequest, res) => {
  const userId = parseInt(req.params.id);
  const order = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (!order || typeof order !== 'object' || !order.orderId) {
    return res.status(400).json({ message: 'Invalid order payload' });
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!user.orderHistory) {
    user.orderHistory = [];
  }

  const alreadyExists = user.orderHistory.some(
    (existingOrder) => existingOrder.orderId === order.orderId
  );
  if (!alreadyExists) {
    user.orderHistory.unshift(order);
    if (user.orderHistory.length > 100) {
      user.orderHistory = user.orderHistory.slice(0, 100);
    }
    persistChanges(res);
  }

  res.status(201).json(sanitizeUser(user));
});

router.get('/:id/pet-management', requireAuth, (req: AuthRequest, res) => {
  const user = parseUserFromParam(req, res);
  if (!user) {
    return;
  }

  return res.json({
    pets: user.petProfiles,
    medicineReminders: user.medicineReminders,
  });
});

router.post('/:id/pets', requireAuth, (req: AuthRequest, res) => {
  const user = parseUserFromParam(req, res);
  if (!user) {
    return;
  }

  const parsed = petCreateSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid pet payload',
      details: parsed.error.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
      })),
    });
  }

  const payload = parsed.data;
  const now = new Date().toISOString();
  const weight = typeof payload.weight === 'number' ? Number(payload.weight.toFixed(2)) : undefined;

  const pet: PetProfileRecord = {
    id: generateRecordId(),
    name: sanitizeString(payload.name).slice(0, 80),
    type: payload.type,
    gender: payload.gender,
    breed: payload.breed ? sanitizeString(payload.breed).slice(0, 80) : undefined,
    birthDate: payload.birthDate,
    weight,
    weightHistory: typeof weight === 'number' ? [{ date: now, weight }] : [],
    activityLevel: payload.activityLevel,
    createdAt: now,
    updatedAt: now,
  };

  user.petProfiles?.push(pet);
  persistChanges(res);
  auditLog('PET_PROFILE_CREATED', user.id, { petId: pet.id });

  return res
    .status(201)
    .json({ pet, pets: user.petProfiles, medicineReminders: user.medicineReminders });
});

router.patch('/:id/pets/:petId', requireAuth, (req: AuthRequest, res) => {
  const user = parseUserFromParam(req, res);
  if (!user) {
    return;
  }

  const parsed = petUpdateSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid pet update payload',
      details: parsed.error.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
      })),
    });
  }

  const petId = sanitizeString(req.params.petId).slice(0, 80);
  const petIndex = (user.petProfiles || []).findIndex((pet) => pet.id === petId);
  if (petIndex === -1) {
    return res.status(404).json({ message: 'Pet not found' });
  }

  const updates = parsed.data;
  const currentPet = user.petProfiles![petIndex];
  const updatedPet: PetProfileRecord = {
    ...currentPet,
    name: updates.name ? sanitizeString(updates.name).slice(0, 80) : currentPet.name,
    breed:
      typeof updates.breed === 'string'
        ? sanitizeString(updates.breed).slice(0, 80)
        : currentPet.breed,
    gender: updates.gender || currentPet.gender,
    activityLevel: updates.activityLevel || currentPet.activityLevel,
    birthDate: updates.birthDate || currentPet.birthDate,
    weight:
      typeof updates.weight === 'number' ? Number(updates.weight.toFixed(2)) : currentPet.weight,
    updatedAt: new Date().toISOString(),
  };

  user.petProfiles![petIndex] = updatedPet;
  persistChanges(res);
  auditLog('PET_PROFILE_UPDATED', user.id, { petId: updatedPet.id });

  return res.json({
    pet: updatedPet,
    pets: user.petProfiles,
    medicineReminders: user.medicineReminders,
  });
});

router.post('/:id/pets/:petId/weights', requireAuth, (req: AuthRequest, res) => {
  const user = parseUserFromParam(req, res);
  if (!user) {
    return;
  }

  const parsed = petWeightSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid weight payload' });
  }

  const petId = sanitizeString(req.params.petId).slice(0, 80);
  const petIndex = (user.petProfiles || []).findIndex((pet) => pet.id === petId);
  if (petIndex === -1) {
    return res.status(404).json({ message: 'Pet not found' });
  }

  const weight = Number(parsed.data.weight.toFixed(2));
  const now = new Date().toISOString();
  const pet = user.petProfiles![petIndex];

  pet.weight = weight;
  pet.weightHistory = [...(pet.weightHistory || []), { date: now, weight }].slice(-120);
  pet.updatedAt = now;
  user.petProfiles![petIndex] = pet;

  persistChanges(res);
  auditLog('PET_WEIGHT_ADDED', user.id, { petId: pet.id });

  return res
    .status(201)
    .json({ pet, pets: user.petProfiles, medicineReminders: user.medicineReminders });
});

router.delete('/:id/pets/:petId', requireAuth, (req: AuthRequest, res) => {
  const user = parseUserFromParam(req, res);
  if (!user) {
    return;
  }

  const petId = sanitizeString(req.params.petId).slice(0, 80);
  const beforeCount = (user.petProfiles || []).length;
  user.petProfiles = (user.petProfiles || []).filter((pet) => pet.id !== petId);

  if (user.petProfiles.length === beforeCount) {
    return res.status(404).json({ message: 'Pet not found' });
  }

  user.medicineReminders = (user.medicineReminders || []).filter(
    (reminder) => reminder.petId !== petId
  );
  persistChanges(res);
  auditLog('PET_PROFILE_DELETED', user.id, { petId });

  return res.json({ pets: user.petProfiles, medicineReminders: user.medicineReminders });
});

router.post('/:id/reminders', requireAuth, (req: AuthRequest, res) => {
  const user = parseUserFromParam(req, res);
  if (!user) {
    return;
  }

  const parsed = reminderCreateSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid reminder payload',
      details: parsed.error.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
      })),
    });
  }

  const payload = parsed.data;
  const hasPet = (user.petProfiles || []).some((pet) => pet.id === payload.petId);
  if (!hasPet) {
    return res.status(400).json({ message: 'Reminder petId does not belong to this user' });
  }

  const reminder: MedicineReminderRecord = {
    id: generateRecordId(),
    petId: payload.petId,
    medicineName: sanitizeString(payload.medicineName).slice(0, 100),
    dosage: sanitizeString(payload.dosage).slice(0, 100),
    frequency: payload.frequency,
    customDays: payload.frequency === 'custom' ? payload.customDays || 1 : undefined,
    startDate: payload.startDate,
    nextDueDate: payload.nextDueDate,
    notes: payload.notes ? sanitizeString(payload.notes).slice(0, 300) : undefined,
    isActive: payload.isActive,
    notificationEnabled: payload.notificationEnabled,
  };

  user.medicineReminders?.push(reminder);
  persistChanges(res);
  auditLog('MEDICINE_REMINDER_CREATED', user.id, {
    reminderId: reminder.id,
    petId: reminder.petId,
  });

  return res
    .status(201)
    .json({ reminder, pets: user.petProfiles, medicineReminders: user.medicineReminders });
});

router.patch('/:id/reminders/:reminderId', requireAuth, (req: AuthRequest, res) => {
  const user = parseUserFromParam(req, res);
  if (!user) {
    return;
  }

  const parsed = reminderUpdateSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid reminder update payload',
      details: parsed.error.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
      })),
    });
  }

  const reminderId = sanitizeString(req.params.reminderId).slice(0, 80);
  const reminderIndex = (user.medicineReminders || []).findIndex(
    (record) => record.id === reminderId
  );
  if (reminderIndex === -1) {
    return res.status(404).json({ message: 'Reminder not found' });
  }

  const updates = parsed.data;
  const current = user.medicineReminders![reminderIndex];
  const updated: MedicineReminderRecord = {
    ...current,
    medicineName:
      typeof updates.medicineName === 'string'
        ? sanitizeString(updates.medicineName).slice(0, 100)
        : current.medicineName,
    dosage:
      typeof updates.dosage === 'string'
        ? sanitizeString(updates.dosage).slice(0, 100)
        : current.dosage,
    frequency: updates.frequency || current.frequency,
    customDays:
      (updates.frequency || current.frequency) === 'custom'
        ? updates.customDays || current.customDays || 1
        : undefined,
    startDate: updates.startDate || current.startDate,
    nextDueDate: updates.nextDueDate || current.nextDueDate,
    notes:
      typeof updates.notes === 'string'
        ? sanitizeString(updates.notes).slice(0, 300)
        : current.notes,
    isActive: typeof updates.isActive === 'boolean' ? updates.isActive : current.isActive,
    notificationEnabled:
      typeof updates.notificationEnabled === 'boolean'
        ? updates.notificationEnabled
        : current.notificationEnabled,
    lastGivenDate: updates.lastGivenDate || current.lastGivenDate,
  };

  user.medicineReminders![reminderIndex] = updated;
  persistChanges(res);
  auditLog('MEDICINE_REMINDER_UPDATED', user.id, { reminderId: updated.id });

  return res.json({
    reminder: updated,
    pets: user.petProfiles,
    medicineReminders: user.medicineReminders,
  });
});

router.post('/:id/reminders/:reminderId/mark-given', requireAuth, (req: AuthRequest, res) => {
  const user = parseUserFromParam(req, res);
  if (!user) {
    return;
  }

  const reminderId = sanitizeString(req.params.reminderId).slice(0, 80);
  const reminderIndex = (user.medicineReminders || []).findIndex(
    (record) => record.id === reminderId
  );
  if (reminderIndex === -1) {
    return res.status(404).json({ message: 'Reminder not found' });
  }

  const current = user.medicineReminders![reminderIndex];
  const now = new Date().toISOString();
  const updated: MedicineReminderRecord = {
    ...current,
    lastGivenDate: now,
    nextDueDate: calculateNextDueDate(current.frequency, current.customDays),
  };

  user.medicineReminders![reminderIndex] = updated;
  persistChanges(res);
  auditLog('MEDICINE_REMINDER_MARKED_GIVEN', user.id, { reminderId: updated.id });

  return res.json({
    reminder: updated,
    pets: user.petProfiles,
    medicineReminders: user.medicineReminders,
  });
});

router.delete('/:id/reminders/:reminderId', requireAuth, (req: AuthRequest, res) => {
  const user = parseUserFromParam(req, res);
  if (!user) {
    return;
  }

  const reminderId = sanitizeString(req.params.reminderId).slice(0, 80);
  const beforeCount = (user.medicineReminders || []).length;
  user.medicineReminders = (user.medicineReminders || []).filter(
    (record) => record.id !== reminderId
  );

  if (beforeCount === user.medicineReminders.length) {
    return res.status(404).json({ message: 'Reminder not found' });
  }

  persistChanges(res);
  auditLog('MEDICINE_REMINDER_DELETED', user.id, { reminderId });

  return res.json({ pets: user.petProfiles, medicineReminders: user.medicineReminders });
});

// Change Password
router.post('/:id/change-password', requireAuth, authLimiter, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { currentPassword, newPassword } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!canAccessUser(req, userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = db.users.find((u) => u.id === userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = user.password?.startsWith('$2')
      ? await comparePassword(currentPassword, user.password)
      : user.password === currentPassword;

    if (!isValidPassword) {
      auditLog('FAILED_PASSWORD_CHANGE', userId, { reason: 'invalid_current_password' });
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Validate new password strength
    const passwordCheck = isStrongPassword(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    // Hash and save new password
    user.password = await hashPassword(newPassword);
    persistChanges(res);

    auditLog('PASSWORD_CHANGED', userId, {});
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ message: 'An error occurred while changing password' });
  }
});

export default router;
