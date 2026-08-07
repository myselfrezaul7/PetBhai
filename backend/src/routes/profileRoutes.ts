import { Router } from 'express';
import { db } from '../db';
import type { User, PetProfileRecord, MedicineReminderRecord } from '../types';
import { AuthRequest, requireAuth, verifyRefreshToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { auditLog } from '../middleware/logger';
import {
  loginAttemptTracker, SALT_ROUNDS, EMAIL_VERIFICATION_TOKEN_TTL_MS, LOCKOUT_WINDOW_MS, LOCKOUT_THRESHOLD, LOCKOUT_DURATION_MS,
  DEFAULT_ADMIN_EMAIL, ADMIN_EMAIL_ALLOWLIST, isValidEmail, sanitizeString, normalizeEmail, isRecordObject, ensureUserCollections,
  userWithAuthMetadata, getRoleByEmail, syncRoleByEmail, isStrongPassword, hashPassword, comparePassword, sanitizeUser,
  canAccessUser, persistChanges, sendAuthError, getClientIp, getLoginAttemptKey, nowMs, checkIpEmailLock, recordFailedLogin,
  clearFailedLogin, hashToken, generateVerificationToken, getTokenVersion, setTokenVersion, setRefreshTokenState,
  clearRefreshTokenState, issueAuthSession, assignNewEmailVerification, isEmailVerified, getNextUserId, generateRecordId,
  ensurePetCollections, parseUserFromParam, calculateNextDueDate,
  petCreateSchema, petUpdateSchema, petWeightSchema, reminderCreateSchema, reminderUpdateSchema, profileUpdateSchema,
  shippingAddressSchema
} from './authHelpers';

const router = Router();
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const requesterId = String(req.user.id);
    if (!Number.isFinite(requesterId)) {
      return res.status(401).json({ message: 'Invalid auth context' });
    }

    const user = db.users.find((record) => Number(record.id) === Number(requesterId));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const roleSynced = syncRoleByEmail(user);
    if (roleSynced) {
      persistChanges(res);
    }

    ensureUserCollections(user);
    return res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update Profile
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = Number(req.params.id);

  if (!userId) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const userIndex = db.users.findIndex((u) => String(u.id) === String(userId));

  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid profile payload',
      errors: parsed.error.flatten(),
    });
  }

  const { name, profilePictureUrl, phone, bio, defaultShippingAddress } = parsed.data;

  const updatedUser = { ...db.users[userIndex] };
  if (typeof name === 'string') {
    updatedUser.name = sanitizeString(name);
  }
  if (typeof profilePictureUrl === 'string') {
    const isHttpUrl =
      profilePictureUrl.startsWith('http://') || profilePictureUrl.startsWith('https://');
    const isDataImageUrl = profilePictureUrl.startsWith('data:image/');
    if (isHttpUrl || isDataImageUrl) {
      updatedUser.profilePictureUrl = profilePictureUrl.slice(0, 5000);
    }
  }
  if (typeof phone === 'string') {
    updatedUser.phone = sanitizeString(phone).slice(0, 30);
  }
  if (typeof bio === 'string') {
    updatedUser.bio = sanitizeString(bio);
  }
  if (defaultShippingAddress) {
    const existing = updatedUser.defaultShippingAddress || { fullName: '', address: '', city: '', phone: '' };
    updatedUser.defaultShippingAddress = {
      fullName: typeof defaultShippingAddress.fullName === 'string' ? sanitizeString(defaultShippingAddress.fullName).slice(0, 120) : existing.fullName || '',
      address: typeof defaultShippingAddress.address === 'string' ? sanitizeString(defaultShippingAddress.address).slice(0, 240) : existing.address || '',
      city: typeof defaultShippingAddress.city === 'string' ? sanitizeString(defaultShippingAddress.city).slice(0, 80) : existing.city || '',
      phone: typeof defaultShippingAddress.phone === 'string' ? sanitizeString(defaultShippingAddress.phone).slice(0, 30) : existing.phone || '',
    };
  }

  db.users[userIndex] = updatedUser;
  persistChanges(res);

  auditLog('PROFILE_UPDATE', userId, { fields: Object.keys(req.body) });
  res.json(sanitizeUser(updatedUser));
});

router.delete('/:id', requireAuth, authLimiter, async (req: AuthRequest, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!canAccessUser(req, userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const userIndex = db.users.findIndex((u) => Number(u.id) === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const candidate = db.users[userIndex];
    const passwordConfirmation =
      typeof req.body?.password === 'string' ? req.body.password : undefined;

    if (candidate.password && !candidate.socialProvider) {
      if (!passwordConfirmation) {
        return res.status(400).json({ message: 'Password confirmation is required' });
      }

      const isValidPassword = candidate.password.startsWith('$2')
        ? await comparePassword(passwordConfirmation, candidate.password)
        : candidate.password === passwordConfirmation;

      if (!isValidPassword) {
        auditLog('FAILED_ACCOUNT_DELETE', userId, { reason: 'invalid_password' });
        return res.status(401).json({ message: 'Password confirmation is incorrect' });
      }
    }

    db.users.splice(userIndex, 1);
    persistChanges(res);

    auditLog('ACCOUNT_DELETED', userId, {
      byAdmin: !!req.user?.isAdmin,
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Account deletion error:', error);
    return res.status(500).json({ message: 'Failed to delete account' });
  }
});

// Add to Wishlist
router.post('/:id/wishlist', requireAuth, async (req: AuthRequest, res) => {
  const userId = Number(req.params.id);
  const { productId } = req.body;

  if (isNaN(userId) || typeof productId !== 'number') {
    return res.status(400).json({ message: 'Invalid user ID or product ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = db.users.find((u) => String(u.id) === String(userId));

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
router.delete('/:id/wishlist/:productId', requireAuth, async (req: AuthRequest, res) => {
  const userId = Number(req.params.id);
  const productId = parseInt(req.params.productId);

  if (isNaN(userId) || isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid user ID or product ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = db.users.find((u) => String(u.id) === String(userId));

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
router.post('/:id/favorites', requireAuth, async (req: AuthRequest, res) => {
  const userId = Number(req.params.id);
  const { animalId } = req.body;

  if (isNaN(userId) || typeof animalId !== 'number') {
    return res.status(400).json({ message: 'Invalid user ID or animal ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = db.users.find((u) => String(u.id) === String(userId));

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
router.delete('/:id/favorites/:animalId', requireAuth, async (req: AuthRequest, res) => {
  const userId = Number(req.params.id);
  const animalId = parseInt(req.params.animalId);

  if (isNaN(userId) || isNaN(animalId)) {
    return res.status(400).json({ message: 'Invalid user ID or animal ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = db.users.find((u) => String(u.id) === String(userId));

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
router.post('/:id/subscribe', requireAuth, async (req: AuthRequest, res) => {
  const userId = Number(req.params.id);

  if (!userId) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = db.users.find((u) => String(u.id) === String(userId));

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
router.post('/:id/orders', requireAuth, async (req: AuthRequest, res) => {
  const userId = Number(req.params.id);
  const order = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (!canAccessUser(req, userId)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (!order || typeof order !== 'object' || !order.orderId) {
    return res.status(400).json({ message: 'Invalid order payload' });
  }

  const user = db.users.find((u) => String(u.id) === String(userId));
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

router.post('/:id/change-password', requireAuth, authLimiter, async (req: AuthRequest, res) => {
  try {
    const userId = Number(req.params.id);
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!canAccessUser(req, userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = db.users.find((u) => String(u.id) === String(userId));

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
