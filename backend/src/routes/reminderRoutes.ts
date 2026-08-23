import { Router } from 'express';
import { db } from '../db';
import type { User, PetProfileRecord, MedicineReminderRecord } from '../types';
import { AuthRequest, requireAuth, verifyRefreshToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { auditLog } from '../middleware/logger';
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
router.post('/:id/reminders', requireAuth, async (req: AuthRequest, res) => {
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
  await persistChanges(res);
  auditLog('MEDICINE_REMINDER_CREATED', user.id, {
    reminderId: reminder.id,
    petId: reminder.petId,
  });

  return res
    .status(201)
    .json({ reminder, pets: user.petProfiles, medicineReminders: user.medicineReminders });
});

router.patch('/:id/reminders/:reminderId', requireAuth, async (req: AuthRequest, res) => {
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
  await persistChanges(res);
  auditLog('MEDICINE_REMINDER_UPDATED', user.id, { reminderId: updated.id });

  return res.json({
    reminder: updated,
    pets: user.petProfiles,
    medicineReminders: user.medicineReminders,
  });
});

router.post('/:id/reminders/:reminderId/mark-given', requireAuth, async (req: AuthRequest, res) => {
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
  await persistChanges(res);
  auditLog('MEDICINE_REMINDER_MARKED_GIVEN', user.id, { reminderId: updated.id });

  return res.json({
    reminder: updated,
    pets: user.petProfiles,
    medicineReminders: user.medicineReminders,
  });
});

router.delete('/:id/reminders/:reminderId', requireAuth, async (req: AuthRequest, res) => {
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

  await persistChanges(res);
  auditLog('MEDICINE_REMINDER_DELETED', user.id, { reminderId });

  return res.json({ pets: user.petProfiles, medicineReminders: user.medicineReminders });
});

// Change Password
export default router;
