import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import type { User } from '../types';
import { AuthRequest, generateToken, requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { auditLog } from '../middleware/logger';

const router = Router();

// Password hashing configuration
const SALT_ROUNDS = 12;

const DEFAULT_ADMIN_EMAIL = 'petbhaibd@gmail.com';

const ADMIN_EMAIL_ALLOWLIST = new Set(
  (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAIL)
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0)
);

// Email validation regex
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize string input
const sanitizeString = (str: string): string => {
  return str.trim().slice(0, 500); // Limit length and trim whitespace
};

const getRoleByEmail = (email: string): 'admin' | 'customer' => {
  return ADMIN_EMAIL_ALLOWLIST.has(email.toLowerCase()) ? 'admin' : 'customer';
};

const syncRoleByEmail = (user: User): boolean => {
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

    const user = db.users.find((u) => u.email.toLowerCase() === sanitizedEmail);

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

    if (db.users.some((u) => u.email.toLowerCase() === sanitizedEmail)) {
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

    let user = db.users.find((u) => u.email.toLowerCase() === sanitizedEmail);

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
