import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import type { Post, Comment, CommentReply, ModerationReport, User } from '../types';

export const liveClients = new Set<express.Response>();
export const REPORT_HIDE_THRESHOLD = 3;
export const POST_COOLDOWN_MS = 15_000;
export const COMMENT_COOLDOWN_MS = 5_000;
export const LIKE_COOLDOWN_MS = 500;
export const MAX_LINKS_PER_POST = 3;
export const MAX_IMAGE_POSTS_PER_MINUTE = 4;
export const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;
export const MAX_STORED_POSTS = 500;
export const POST_AGE_LIMIT_MS = 90 * 24 * 60 * 60 * 1000;

export const cooldownTracker = new Map<string, number>();
export const mediaRateTracker = new Map<string, number[]>();
export const idempotencyStore = new Map<string, { status: number; payload: unknown; expiresAt: number }>();

export const ensurePostsCollection = (): void => {
  if (!Array.isArray(db.data.posts)) {
    db.data.posts = [];
  }
};

export const cleanupOldPosts = async (): Promise<void> => {
  ensurePostsCollection();

  const now = Date.now();
  const originalLength = db.data.posts.length;

  db.data.posts = db.data.posts.filter((post: Post) => {
    const postTime = new Date(post.timestamp).getTime();
    if (!Number.isFinite(postTime)) {
      return false;
    }
    return now - postTime <= POST_AGE_LIMIT_MS;
  });

  if (db.data.posts.length > MAX_STORED_POSTS) {
    db.data.posts.sort((a: Post, b: Post) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    db.data.posts = db.data.posts.slice(0, MAX_STORED_POSTS);
  }

  if (db.data.posts.length < originalLength) {
    await db.write();
  }
};

cleanupOldPosts();

export const ensureModerationCollection = (): ModerationReport[] => {
  const record = db.data as unknown as Record<string, unknown>;
  if (!Array.isArray(record.moderationReports)) {
    record.moderationReports = [];
  }
  return record.moderationReports as ModerationReport[];
};

export const filterVisiblePost = (post: Post): Post | null => {
  if (post.hidden) return null;
  return {
    ...post,
    comments: post.comments
      .filter((comment) => !comment.hidden)
      .map((comment) => ({
        ...comment,
        replies: comment.replies.filter((reply) => !reply.hidden),
      })),
  };
};

export const getSortedVisiblePosts = (): Post[] => {
  ensurePostsCollection();
  return [...db.posts]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map(filterVisiblePost)
    .filter((post): post is Post => post !== null);
};

export const resolveUserById = (userId: number | string): User | null => {
  const user = db.users.find((record: User) => Number(record.id) === Number(userId));
  return user || null;
};

export type UserCommunityMetadata = User & {
  emailVerified?: boolean;
};

export const userWithCommunityMetadata = (user: User): UserCommunityMetadata => {
  return user as UserCommunityMetadata;
};

export const ensureVerifiedUser = (userId: number | string): { ok: true } | { ok: false; message: string } => {
  const user = resolveUserById(userId);
  if (!user) {
    return { ok: false, message: 'User not found' };
  }

  const bannedUsers = Array.isArray((db.data as unknown as Record<string, unknown>).bannedUsers)
    ? ((db.data as unknown as Record<string, unknown>).bannedUsers as number[])
    : [];

  if (bannedUsers.includes(Number(userId))) {
    return { ok: false, message: 'Your account is suspended from community interactions.' };
  }

  if (!Boolean(userWithCommunityMetadata(user).emailVerified)) {
    return { ok: false, message: 'Please verify your email before posting or interacting.' };
  }

  return { ok: true };
};

export const assertCooldown = (
  key: string,
  cooldownMs: number
): { ok: true } | { ok: false; retryAfterMs: number } => {
  const now = Date.now();
  const nextAllowedAt = cooldownTracker.get(key) || 0;
  if (nextAllowedAt > now) {
    return { ok: false, retryAfterMs: nextAllowedAt - now };
  }

  cooldownTracker.set(key, now + cooldownMs);
  return { ok: true };
};

export const countLinks = (text: string): number => {
  const linkMatches = text.match(/https?:\/\//gi);
  return linkMatches ? linkMatches.length : 0;
};

export const assertMediaRate = (userId: number | string): { ok: true } | { ok: false; message: string } => {
  const now = Date.now();
  const key = String(userId);
  const entries = (mediaRateTracker.get(key) || []).filter((ts) => now - ts <= 60_000);
  if (entries.length >= MAX_IMAGE_POSTS_PER_MINUTE) {
    mediaRateTracker.set(key, entries);
    return { ok: false, message: 'Image post rate limit reached. Please wait a minute.' };
  }
  entries.push(now);
  mediaRateTracker.set(key, entries);
  return { ok: true };
};

export const cleanupIdempotencyStore = (): void => {
  const now = Date.now();
  for (const [key, value] of idempotencyStore.entries()) {
    if (value.expiresAt <= now) {
      idempotencyStore.delete(key);
    }
  }
};

export const getIdempotencyCacheKey = (req: express.Request, actorId: number | string | null): string | null => {
  const key = req.get('X-Idempotency-Key');
  if (!key || key.trim().length < 8) {
    return null;
  }

  const actor = actorId ?? 'anonymous';
  return `${req.method}:${req.path}:${actor}:${key.trim()}`;
};

export const getCachedIdempotentResponse = (
  cacheKey: string | null
): { status: number; payload: unknown } | null => {
  if (!cacheKey) return null;
  cleanupIdempotencyStore();
  const cached = idempotencyStore.get(cacheKey);
  if (!cached) return null;
  return { status: cached.status, payload: cached.payload };
};

export const setCachedIdempotentResponse = (
  cacheKey: string | null,
  status: number,
  payload: unknown
): void => {
  if (!cacheKey) return;
  idempotencyStore.set(cacheKey, {
    status,
    payload,
    expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
  });
};

export const createReport = (
  targetType: ModerationReport['targetType'],
  reporterId: number,
  reason: string,
  targetPostId: number,
  targetCommentId?: number,
  targetReplyId?: number
): ModerationReport => {
  const now = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    targetType,
    targetPostId,
    targetCommentId,
    targetReplyId,
    reporterId,
    reason,
    status: 'open',
    createdAt: now,
    updatedAt: now,
    history: [
      {
        at: now,
        action: 'reported',
        actorId: reporterId,
        note: reason,
      },
    ],
  };
};

export const applyAutoHideByThreshold = (
  post: Post,
  targetType: ModerationReport['targetType'],
  commentId?: number,
  replyId?: number
): void => {
  if (targetType === 'post') {
    post.reportCount = (post.reportCount || 0) + 1;
    if ((post.reportCount || 0) >= REPORT_HIDE_THRESHOLD) {
      post.hidden = true;
    }
    return;
  }

  const comment = post.comments.find((entry) => entry.id === commentId);
  if (!comment) return;

  if (targetType === 'comment') {
    comment.reportCount = (comment.reportCount || 0) + 1;
    if ((comment.reportCount || 0) >= REPORT_HIDE_THRESHOLD) {
      comment.hidden = true;
    }
    return;
  }

  const reply = comment.replies.find((entry) => entry.id === replyId);
  if (!reply) return;
  reply.reportCount = (reply.reportCount || 0) + 1;
  if ((reply.reportCount || 0) >= REPORT_HIDE_THRESHOLD) {
    reply.hidden = true;
  }
};

export const emitPostEvent = (eventType: string, postId?: number): void => {
  const payload = JSON.stringify({
    type: eventType,
    postId,
    timestamp: new Date().toISOString(),
  });

  for (const client of liveClients) {
    try {
      client.write(`event: post-update\n`);
      client.write(`data: ${payload}\n\n`);
    } catch {
      liveClients.delete(client);
      client.end();
    }
  }
};

export const authorSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().min(1).max(100),
    profilePictureUrl: z.string().max(3000).optional(),
  })
  .strict();

export const createPostSchema = z
  .object({
    author: authorSchema,
    content: z.string().min(1).max(5000),
    imageUrl: z
      .string()
      .max(3 * 1024 * 1024)
      .optional(),
  })
  .strict();

export const updatePostSchema = z
  .object({
    content: z.string().min(1).max(5000),
    authorId: z.number().int().positive(),
  })
  .strict();

export const userIdSchema = z
  .object({
    userId: z.number().int().positive(),
  })
  .strict();

export const commentSchema = z
  .object({
    author: authorSchema,
    text: z.string().min(1).max(2000),
  })
  .strict();

export const replySchema = z
  .object({
    author: authorSchema,
    text: z.string().min(1).max(1000),
  })
  .strict();

export const updateCommentSchema = z
  .object({
    userId: z.number().int().positive(),
    text: z.string().min(1).max(2000),
  })
  .strict();

export const updateReplySchema = z
  .object({
    userId: z.number().int().positive(),
    text: z.string().min(1).max(1000),
  })
  .strict();

// Security: Sanitize text input
export const sanitizeText = (text: unknown, maxLength: number = 5000): string => {
  if (typeof text !== 'string') return '';
  return text.replace(/\0/g, '').trim().slice(0, maxLength);
};

// Security: Validate positive integer ID
export const validateId = (id: unknown): number | null => {
  const num = parseInt(String(id), 10);
  return Number.isFinite(num) && num > 0 ? num : null;
};

// Security: Validate author object
export const validateAuthor = (
  author: unknown
): { id: string; name: string; profilePictureUrl?: string } | null => {
  if (!author || typeof author !== 'object') return null;
  const a = author as Record<string, unknown>;

  const id = String(a.id);
  if (!id) return null;

  const name = sanitizeText(a.name, 100);
  if (!name) return null;

  return {
    id,
    name,
    profilePictureUrl: typeof a.profilePictureUrl === 'string' ? a.profilePictureUrl : undefined,
  };
};
