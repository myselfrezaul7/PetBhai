import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { db } from '../db';
import type { AdminUsersSummary } from '../types';
import { requireRole, requireAuth, verifyToken } from '../middleware/auth';
import { subscribeAdminClient } from '../realtime/adminEvents';

const router = Router();

const buildAdminUserSummary = (): AdminUsersSummary[] => {
  const postStats = new Map<number, { postCount: number; commentCount: number; replyCount: number }>();

  for (const post of db.posts) {
    const postAuthorId = Number(post.author.id);
    if (Number.isFinite(postAuthorId)) {
      const current = postStats.get(postAuthorId) || { postCount: 0, commentCount: 0, replyCount: 0 };
      current.postCount += 1;
      postStats.set(postAuthorId, current);
    }

    for (const comment of post.comments) {
      const commentAuthorId = Number(comment.author.id);
      if (Number.isFinite(commentAuthorId)) {
        const current = postStats.get(commentAuthorId) || {
          postCount: 0,
          commentCount: 0,
          replyCount: 0,
        };
        current.commentCount += 1;
        postStats.set(commentAuthorId, current);
      }

      for (const reply of comment.replies) {
        const replyAuthorId = Number(reply.author.id);
        if (Number.isFinite(replyAuthorId)) {
          const current = postStats.get(replyAuthorId) || {
            postCount: 0,
            commentCount: 0,
            replyCount: 0,
          };
          current.replyCount += 1;
          postStats.set(replyAuthorId, current);
        }
      }
    }
  }

  const bannedSet = new Set((db.data as unknown as Record<string, unknown>).bannedUsers as number[]);

  return db.users
    .map((user) => {
      const idStr = String(user.id);
      const stats = postStats.get(Number(user.id)) || (postStats.get(user.id as any)) || { postCount: 0, commentCount: 0, replyCount: 0 };
      return {
        id: idStr,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: Boolean(user.emailVerified),
        isBanned: bannedSet.has(Number(user.id)) || (bannedSet.has(user.id as any)),
        bannedAt: user.bannedAt,
        banReason: user.banReason,
        postCount: stats.postCount,
        commentCount: stats.commentCount,
        replyCount: stats.replyCount,
      } as AdminUsersSummary;
    })
    .sort((a, b) => {
      if (a.isBanned !== b.isBanned) {
        return a.isBanned ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
};

const adminActionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many admin actions, please try again shortly' },
});

router.use(adminActionLimiter);

router.get('/users', requireAuth, requireRole(['super_admin', 'store_manager', 'moderator']), (_req, res) => {
  const users = buildAdminUserSummary();
  return res.json({
    items: users,
    total: users.length,
  });
});

const banSchema = z.object({
  reason: z.string().trim().min(3).max(300).optional(),
});

router.post('/users/:id/ban', requireAuth, requireRole(['super_admin', 'store_manager', 'moderator']), async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(Number(userId)) || Number(userId) <= 0) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const parsed = banSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid reason format' });
  }

  const targetUser = db.users.find((u) => Number(u.id) === Number(userId));
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (targetUser.role === 'super_admin') {
    return res.status(403).json({ message: 'Cannot ban a super admin' });
  }

  if (!Array.isArray(db.data.bannedUsers)) {
    db.data.bannedUsers = [];
  }

  if (!db.data.bannedUsers.includes(userId)) {
    db.data.bannedUsers.push(userId);
  }

  targetUser.bannedAt = new Date().toISOString();
  targetUser.banReason = parsed.data.reason || 'Banned by admin moderation';
  await db.write();

  return res.json({
    message: 'User banned successfully',
    userId,
    bannedAt: targetUser.bannedAt,
    reason: targetUser.banReason,
  });
});

router.post('/users/:id/unban', requireAuth, requireRole(['super_admin', 'store_manager', 'moderator']), async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(Number(userId)) || Number(userId) <= 0) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const targetUser = db.users.find((u) => Number(u.id) === Number(userId));
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!Array.isArray(db.data.bannedUsers)) {
    db.data.bannedUsers = [];
  }

  db.data.bannedUsers = db.data.bannedUsers.filter((id) => Number(id) !== userId);
  delete targetUser.bannedAt;
  delete targetUser.banReason;
  await db.write();

  return res.json({ message: 'User unbanned successfully', userId });
});

const roleUpdateSchema = z.object({
  role: z.enum(['customer', 'moderator', 'store_manager', 'super_admin']),
});

router.put('/users/:id/role', requireAuth, requireRole(['super_admin']), async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(Number(userId)) || Number(userId) <= 0) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const parsed = roleUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const targetUser = db.users.find((u) => Number(u.id) === Number(userId));
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (String(userId) === String((req as any).user?.id)) {
    return res.status(400).json({ message: 'You cannot change your own role' });
  }

  targetUser.role = parsed.data.role;
  await db.write();
  return res.json({ message: 'User role updated successfully', role: targetUser.role });
});

router.get('/posts', requireAuth, requireRole(['super_admin', 'moderator']), (_req, res) => {
  const items = [...db.posts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return res.json({ items, total: items.length });
});

router.delete('/posts/:id', requireAuth, requireRole(['super_admin', 'moderator']), async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isFinite(postId) || postId <= 0) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  const before = db.posts.length;
  db.data.posts = db.posts.filter((post) => post.id !== postId);
  if (db.posts.length === before) {
    return res.status(404).json({ message: 'Post not found' });
  }

  await db.write();
  return res.json({ message: 'Post deleted permanently', postId });
});

router.get('/stream', async (req, res) => {
  const authHeader = req.headers.authorization;
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
  const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : queryToken;
  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  const decoded = verifyToken(token);
  if (!decoded?.isAdmin && decoded?.role !== 'super_admin' && decoded?.role !== 'store_manager') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const unsubscribe = subscribeAdminClient(res);

  req.on('close', () => {
    unsubscribe();
  });
});

export default router;
