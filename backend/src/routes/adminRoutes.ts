import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import type { AdminUsersSummary } from '../types';
import { requireAdmin, requireAuth, verifyToken } from '../middleware/auth';
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
      const id = Number(user.id);
      if (!Number.isFinite(id)) {
        return null;
      }

      const stats = postStats.get(id) || { postCount: 0, commentCount: 0, replyCount: 0 };
      return {
        id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: Boolean(user.emailVerified),
        isBanned: bannedSet.has(id),
        bannedAt: user.bannedAt,
        banReason: user.banReason,
        postCount: stats.postCount,
        commentCount: stats.commentCount,
        replyCount: stats.replyCount,
      } as AdminUsersSummary;
    })
    .filter((item): item is AdminUsersSummary => item !== null)
    .sort((a, b) => {
      if (a.isBanned !== b.isBanned) {
        return a.isBanned ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
};

router.get('/users', requireAuth, requireAdmin, (_req, res) => {
  return res.json({ items: buildAdminUserSummary(), total: db.users.length });
});

const banPayloadSchema = z
  .object({
    reason: z.string().trim().min(3).max(500).optional(),
  })
  .strict();

router.post('/users/:id/ban', requireAuth, requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const parsed = banPayloadSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid ban payload' });
  }

  const targetUser = db.users.find((u) => Number(u.id) === userId);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (targetUser.role === 'admin') {
    return res.status(400).json({ message: 'Admin accounts cannot be banned from this endpoint' });
  }

  if (!Array.isArray(db.data.bannedUsers)) {
    db.data.bannedUsers = [];
  }

  if (!db.data.bannedUsers.includes(userId)) {
    db.data.bannedUsers.push(userId);
  }

  targetUser.bannedAt = new Date().toISOString();
  targetUser.banReason = parsed.data.reason || 'Banned by admin moderation';
  db.write();

  return res.json({
    message: 'User banned successfully',
    userId,
    bannedAt: targetUser.bannedAt,
    reason: targetUser.banReason,
  });
});

router.post('/users/:id/unban', requireAuth, requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const targetUser = db.users.find((u) => Number(u.id) === userId);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!Array.isArray(db.data.bannedUsers)) {
    db.data.bannedUsers = [];
  }

  db.data.bannedUsers = db.data.bannedUsers.filter((id) => Number(id) !== userId);
  delete targetUser.bannedAt;
  delete targetUser.banReason;
  db.write();

  return res.json({ message: 'User unbanned successfully', userId });
});

router.get('/posts', requireAuth, requireAdmin, (_req, res) => {
  const items = [...db.posts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return res.json({ items, total: items.length });
});

router.delete('/posts/:id', requireAuth, requireAdmin, (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isFinite(postId) || postId <= 0) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  const before = db.posts.length;
  db.data.posts = db.posts.filter((post) => post.id !== postId);
  if (db.posts.length === before) {
    return res.status(404).json({ message: 'Post not found' });
  }

  db.write();
  return res.json({ message: 'Post deleted permanently', postId });
});

router.get('/stream', (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  const decoded = verifyToken(token);
  if (!decoded?.isAdmin) {
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
