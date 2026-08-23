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
router.get('/:id/pet-management', requireAuth, async (req: AuthRequest, res) => {
  const user = parseUserFromParam(req, res);
  if (!user) {
    return;
  }

  return res.json({
    pets: user.petProfiles,
    medicineReminders: user.medicineReminders,
  });
});

router.post('/:id/pets', requireAuth, async (req: AuthRequest, res) => {
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
  await persistChanges(res);
  auditLog('PET_PROFILE_CREATED', user.id, { petId: pet.id });

  return res
    .status(201)
    .json({ pet, pets: user.petProfiles, medicineReminders: user.medicineReminders });
});

router.patch('/:id/pets/:petId', requireAuth, async (req: AuthRequest, res) => {
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
  await persistChanges(res);
  auditLog('PET_PROFILE_UPDATED', user.id, { petId: updatedPet.id });

  return res.json({
    pet: updatedPet,
    pets: user.petProfiles,
    medicineReminders: user.medicineReminders,
  });
});

router.post('/:id/pets/:petId/weights', requireAuth, async (req: AuthRequest, res) => {
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

  await persistChanges(res);
  auditLog('PET_WEIGHT_ADDED', user.id, { petId: pet.id });

  return res
    .status(201)
    .json({ pet, pets: user.petProfiles, medicineReminders: user.medicineReminders });
});

router.delete('/:id/pets/:petId', requireAuth, async (req: AuthRequest, res) => {
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
  await persistChanges(res);
  auditLog('PET_PROFILE_DELETED', user.id, { petId });

  return res.json({ pets: user.petProfiles, medicineReminders: user.medicineReminders });
});

export default router;
