import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import type { User } from '../types';
import { generateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { auditLog } from '../middleware/logger';

const router = Router();

// Password hashing configuration
const SALT_ROUNDS = 12;

// Email validation regex
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize string input
const sanitizeString = (str: string): string => {
  return str.trim().slice(0, 500); // Limit length and trim whitespace
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

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      isPlusMember: user.isPlusMember,
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
      wishlist: [],
      orderHistory: [],
      favorites: [],
      isPlusMember: false,
    };

    db.users.push(newUser);

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      isPlusMember: newUser.isPlusMember,
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

// Update Profile
router.put('/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, profilePictureUrl } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
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

  auditLog('PROFILE_UPDATE', userId, { fields: Object.keys(req.body) });
  res.json(sanitizeUser(updatedUser));
});

// Add to Wishlist
router.post('/:id/wishlist', (req, res) => {
  const userId = parseInt(req.params.id);
  const { productId } = req.body;

  if (isNaN(userId) || typeof productId !== 'number') {
    return res.status(400).json({ message: 'Invalid user ID or product ID' });
  }

  const user = db.users.find((u) => u.id === userId);

  if (user) {
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
    }
    res.json(sanitizeUser(user));
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Remove from Wishlist
router.delete('/:id/wishlist/:productId', (req, res) => {
  const userId = parseInt(req.params.id);
  const productId = parseInt(req.params.productId);

  if (isNaN(userId) || isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid user ID or product ID' });
  }

  const user = db.users.find((u) => u.id === userId);

  if (user) {
    user.wishlist = user.wishlist.filter((id) => id !== productId);
    res.json(sanitizeUser(user));
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Add to Favorites (Animals)
router.post('/:id/favorites', (req, res) => {
  const userId = parseInt(req.params.id);
  const { animalId } = req.body;

  if (isNaN(userId) || typeof animalId !== 'number') {
    return res.status(400).json({ message: 'Invalid user ID or animal ID' });
  }

  const user = db.users.find((u) => u.id === userId);

  if (user) {
    if (!user.favorites.includes(animalId)) {
      user.favorites.push(animalId);
    }
    res.json(sanitizeUser(user));
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Remove from Favorites
router.delete('/:id/favorites/:animalId', (req, res) => {
  const userId = parseInt(req.params.id);
  const animalId = parseInt(req.params.animalId);

  if (isNaN(userId) || isNaN(animalId)) {
    return res.status(400).json({ message: 'Invalid user ID or animal ID' });
  }

  const user = db.users.find((u) => u.id === userId);

  if (user) {
    user.favorites = user.favorites.filter((id) => id !== animalId);
    res.json(sanitizeUser(user));
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Subscribe to Plus
router.post('/:id/subscribe', (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const user = db.users.find((u) => u.id === userId);

  if (user) {
    user.isPlusMember = true;
    auditLog('PLUS_SUBSCRIPTION', userId, { status: 'subscribed' });
    res.json(sanitizeUser(user));
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Change Password
router.post('/:id/change-password', authLimiter, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { currentPassword, newPassword } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
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

    auditLog('PASSWORD_CHANGED', userId, {});
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ message: 'An error occurred while changing password' });
  }
});

export default router;
