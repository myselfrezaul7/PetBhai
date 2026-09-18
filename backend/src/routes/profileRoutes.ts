import { Router, Response } from 'express';
import { db } from '../db';
import type { User, PetProfileRecord, MedicineReminderRecord, UserNotification } from '../types';
import { AuthRequest, requireAuth, verifyRefreshToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { auditLog } from '../middleware/logger';
import { syncNotificationToFirestore } from '../services/firestoreSync';
import {
  loginAttemptTracker,
  SALT_ROUNDS,
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
  LOCKOUT_WINDOW_MS,
  LOCKOUT_THRESHOLD,
  LOCKOUT_DURATION_MS,
  DEFAULT_ADMIN_EMAIL,
  ADMIN_EMAIL_ALLOWLIST,
  isValidEmail,
  sanitizeString,
  normalizeEmail,
  isRecordObject,
  ensureUserCollections,
  userWithAuthMetadata,
  getRoleByEmail,
  syncRoleByEmail,
  isStrongPassword,
  hashPassword,
  comparePassword,
  sanitizeUser,
  canAccessUser,
  persistChanges,
  sendAuthError,
  getClientIp,
  getLoginAttemptKey,
  nowMs,
  checkIpEmailLock,
  recordFailedLogin,
  clearFailedLogin,
  hashToken,
  generateVerificationToken,
  getTokenVersion,
  setTokenVersion,
  setRefreshTokenState,
  clearRefreshTokenState,
  issueAuthSession,
  assignNewEmailVerification,
  isEmailVerified,
  getNextUserId,
  generateRecordId,
  ensurePetCollections,
  parseUserFromParam,
  calculateNextDueDate,
  petCreateSchema,
  petUpdateSchema,
  petWeightSchema,
  reminderCreateSchema,
  reminderUpdateSchema,
  profileUpdateSchema,
  shippingAddressSchema,
} from './authHelpers';

const router = Router();
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const requesterId = String(req.user.id);
    let user = db.users.find(
      (record) => String(record.id) === requesterId || Number(record.id) === Number(requesterId)
    );

    if (!user && req.user.email) {
      const normalizedReqEmail = normalizeEmail(req.user.email);
      user = db.users.find((record) => normalizeEmail(record.email) === normalizedReqEmail);
    }

    if (!user && req.user.email && isValidEmail(req.user.email)) {
      const normalizedEmailStr = normalizeEmail(req.user.email);
      const isVerified = true;
      const role = req.user.role || getRoleByEmail(normalizedEmailStr, isVerified);
      const newUser: User = {
        id: req.user.id,
        name: req.user.name || 'User',
        email: normalizedEmailStr,
        role: role as any,
        isPlusMember: Boolean(req.user.isPlusMember),
        emailVerified: true,
        tokenVersion: 0,
        wishlist: [],
        orderHistory: [],
        favorites: [],
        petProfiles: [],
        medicineReminders: [],
      };
      db.users.push(newUser);
      await persistChanges(res);
      user = newUser;
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const roleSynced = syncRoleByEmail(user);
    if (roleSynced) {
      await persistChanges(res);
    }

    ensureUserCollections(user);
    return res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

export const generateDefaultNotificationsForUser = (user: User): UserNotification[] => {
  const generated: UserNotification[] = [];
  const now = new Date();

  // 1. Medicine reminders
  if (Array.isArray(user.medicineReminders)) {
    for (const reminder of user.medicineReminders) {
      if (reminder.isActive && reminder.nextDueDate) {
        const dueDate = new Date(reminder.nextDueDate);
        const isOverdue = dueDate.getTime() < now.getTime();
        const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        const pet = (user.petProfiles || []).find((p) => p.id === reminder.petId);
        const petName = pet?.name || 'your pet';

        if (isOverdue) {
          generated.push({
            id: `reminder-overdue-${reminder.id}`,
            userId: user.id,
            title: `Medication Overdue: ${reminder.medicineName}`,
            message: `${reminder.dosage} of ${reminder.medicineName} for ${petName} was due on ${dueDate.toLocaleDateString()}.`,
            type: 'reminder',
            isRead: false,
            createdAt: reminder.nextDueDate,
            metadata: { reminderId: reminder.id, petId: reminder.petId },
          });
        } else if (diffHours >= 0 && diffHours <= 48) {
          generated.push({
            id: `reminder-upcoming-${reminder.id}`,
            userId: user.id,
            title: `Medication Reminder: ${reminder.medicineName}`,
            message: `Upcoming: ${reminder.dosage} of ${reminder.medicineName} for ${petName} is due soon.`,
            type: 'reminder',
            isRead: false,
            createdAt: new Date().toISOString(),
            metadata: { reminderId: reminder.id, petId: reminder.petId },
          });
        }
      }
    }
  }

  // 2. Recent orders
  const orderMap = new Map<string, any>();
  for (const o of user.orderHistory || []) {
    if (o && o.orderId) orderMap.set(o.orderId, o);
  }
  for (const o of db.orders || []) {
    if (
      o &&
      (Number((o as any).userId) === Number(user.id) ||
        String((o as any).userId) === String(user.id))
    ) {
      orderMap.set(o.orderId, o);
    }
  }

  const allOrders = Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (const order of allOrders.slice(0, 10)) {
    if (order && order.orderId) {
      const status = order.status || 'pending';
      const statusTitle =
        status === 'delivered'
          ? 'Order Delivered!'
          : status === 'shipped'
            ? 'Order on the Way!'
            : status === 'confirmed' || status === 'processing'
              ? `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`
              : status === 'cancelled'
                ? 'Order Cancelled'
                : status === 'refunded'
                  ? 'Order Refunded'
                  : 'Order Placed';

      const statusMsg =
        status === 'delivered'
          ? `Your order #${order.orderId} has been successfully delivered.`
          : status === 'shipped'
            ? `Your order #${order.orderId} has been shipped.${order.trackingNumber ? ` Tracking: ${order.trackingNumber}` : ''}`
            : status === 'cancelled'
              ? `Your order #${order.orderId} has been cancelled.`
              : `Your order #${order.orderId} is currently ${status}.`;

      generated.push({
        id: `order-status-${order.orderId}-${status}`,
        userId: user.id,
        title: statusTitle,
        message: statusMsg,
        type: 'order',
        isRead: false,
        createdAt: order.date || new Date().toISOString(),
        metadata: { orderId: order.orderId, status },
      });
    }
  }

  return generated;
};

// Get current user's notifications
router.get('/me/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const requesterId = String(req.user.id);
    const user = db.users.find(
      (record) => String(record.id) === requesterId || Number(record.id) === Number(requesterId)
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    ensureUserCollections(user);
    if (!Array.isArray(user.notifications)) {
      user.notifications = [];
    }

    const generatedNotifs = generateDefaultNotificationsForUser(user);
    const existingMap = new Map<string, UserNotification>(user.notifications.map((n) => [n.id, n]));

    let hasNew = false;
    for (const gen of generatedNotifs) {
      if (!existingMap.has(gen.id)) {
        user.notifications.unshift(gen);
        existingMap.set(gen.id, gen);
        hasNew = true;
        syncNotificationToFirestore(user.id, gen).catch((err) => {
          console.warn('Failed to sync notification to Firestore:', err);
        });
      }
    }

    if (hasNew) {
      await persistChanges(res);
    }

    const sorted = [...user.notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.json({
      notifications: sorted,
      total: sorted.length,
      unreadCount: sorted.filter((n) => !n.isRead).length,
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark single notification read
router.patch('/me/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const requesterId = String(req.user.id);
    const user = db.users.find(
      (record) => String(record.id) === requesterId || Number(record.id) === Number(requesterId)
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!Array.isArray(user.notifications)) {
      user.notifications = [];
    }

    const notifId = String(req.params.id);
    const notification = user.notifications.find((n) => String(n.id) === notifId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await persistChanges(res);

    syncNotificationToFirestore(user.id, notification).catch((err) => {
      console.warn('Failed to sync notification read state to Firestore:', err);
    });

    return res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications read
const markAllNotificationsReadHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const requesterId = String(req.user.id);
    const user = db.users.find(
      (record) => String(record.id) === requesterId || Number(record.id) === Number(requesterId)
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!Array.isArray(user.notifications)) {
      user.notifications = [];
    }

    for (const n of user.notifications) {
      n.isRead = true;
    }

    await persistChanges(res);

    return res.json({
      message: 'All notifications marked as read',
      notifications: user.notifications,
      unreadCount: 0,
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
};

router.post('/me/notifications/read-all', requireAuth, markAllNotificationsReadHandler);
router.patch('/me/notifications/read-all', requireAuth, markAllNotificationsReadHandler);

// Get Profile by ID
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!canAccessUser(req, userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = db.users.find(
      (u) => String(u.id) === String(userId) || Number(u.id) === Number(userId)
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    ensureUserCollections(user);
    return res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Fetch user by ID error:', error);
    return res.status(500).json({ message: 'Failed to fetch user' });
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
    const existing = updatedUser.defaultShippingAddress || {
      fullName: '',
      address: '',
      city: '',
      phone: '',
    };
    updatedUser.defaultShippingAddress = {
      fullName:
        typeof defaultShippingAddress.fullName === 'string'
          ? sanitizeString(defaultShippingAddress.fullName).slice(0, 120)
          : existing.fullName || '',
      address:
        typeof defaultShippingAddress.address === 'string'
          ? sanitizeString(defaultShippingAddress.address).slice(0, 240)
          : existing.address || '',
      city:
        typeof defaultShippingAddress.city === 'string'
          ? sanitizeString(defaultShippingAddress.city).slice(0, 80)
          : existing.city || '',
      phone:
        typeof defaultShippingAddress.phone === 'string'
          ? sanitizeString(defaultShippingAddress.phone).slice(0, 30)
          : existing.phone || '',
    };
  }

  db.users[userIndex] = updatedUser;
  await persistChanges(res);

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
      typeof req.body?.passwordConfirmation === 'string' &&
      req.body.passwordConfirmation.trim().length > 0
        ? req.body.passwordConfirmation.trim()
        : typeof req.body?.password === 'string' && req.body.password.trim().length > 0
          ? req.body.password.trim()
          : undefined;

    const hasPassword = typeof candidate.password === 'string' && candidate.password.length > 0;
    const isSocialAccount = Boolean(candidate.socialProvider);

    // If user has no password or has socialProvider, allow deletion directly.
    // If user has password, require and verify passwordConfirmation, returning a clear error if missing or invalid.
    if (hasPassword && !isSocialAccount) {
      if (!passwordConfirmation) {
        return res.status(400).json({
          code: 'AUTH_PASSWORD_REQUIRED',
          message: 'Password confirmation is required to delete this account',
        });
      }

      const isValidPassword = candidate.password!.startsWith('$2')
        ? await comparePassword(passwordConfirmation, candidate.password!)
        : candidate.password === passwordConfirmation;

      if (!isValidPassword) {
        auditLog('FAILED_ACCOUNT_DELETE', userId, { reason: 'invalid_password' });
        return res.status(401).json({
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Password confirmation is incorrect',
        });
      }
    }

    db.users.splice(userIndex, 1);
    await persistChanges(res);

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
      await persistChanges(res);
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
    await persistChanges(res);
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
      await persistChanges(res);
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
    await persistChanges(res);
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
    await persistChanges(res);
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
    await persistChanges(res);
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
    await persistChanges(res);

    auditLog('PASSWORD_CHANGED', userId, {});
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ message: 'An error occurred while changing password' });
  }
});

export default router;
