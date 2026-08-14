import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { postMutationLimiter } from '../middleware/rateLimiter';
import {
  validateId,
  ensureModerationCollection,
  createReport,
  sanitizeText,
  applyAutoHideByThreshold,
  emitPostEvent
} from './postHelpers';

const router = express.Router();

const reportSchema = z
  .object({
    reporterId: z.union([z.number().int().positive(), z.string().min(1)]),
    reason: z.string().trim().min(3).max(500),
  })
  .strict();

router.post('/:id(\\d+)/report', postMutationLimiter, requireAuth, async (req: AuthRequest, res) => {
  const postId = validateId(req.params.id);
  if (!postId) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  const requesterId = String(req.user?.id);
  if (!requesterId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid report payload' });
  }

  const { reporterId, reason } = parsed.data;
  if (String(reporterId) !== String(requesterId)) {
    return res.status(403).json({ message: 'Cannot report as another user' });
  }

  const post = db.posts.find((entry) => entry.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const reports = ensureModerationCollection();
  const report = createReport('post', reporterId, sanitizeText(reason, 500), postId);
  reports.push(report);
  applyAutoHideByThreshold(post, 'post');
  await db.write();
  emitPostEvent('post-reported', postId);
  return res.status(201).json({ message: 'Report submitted', reportId: report.id });
});

router.post('/:postId/comments/:commentId/report', postMutationLimiter, requireAuth, async (req: AuthRequest, res) => {
  const postId = validateId(req.params.postId);
  const commentId = validateId(req.params.commentId);
  if (!postId || !commentId) {
    return res.status(400).json({ message: 'Invalid post or comment ID' });
  }

  const requesterId = String(req.user?.id);
  if (!requesterId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid report payload' });
  }

  const { reporterId, reason } = parsed.data;
  if (String(reporterId) !== String(requesterId)) {
    return res.status(403).json({ message: 'Cannot report as another user' });
  }

  const post = db.posts.find((entry) => entry.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const comment = post.comments.find((entry) => entry.id === commentId);
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  const reports = ensureModerationCollection();
  const report = createReport('comment', reporterId, sanitizeText(reason, 500), postId, commentId);
  reports.push(report);
  applyAutoHideByThreshold(post, 'comment', commentId);
  await db.write();
  emitPostEvent('comment-reported', postId);
  return res.status(201).json({ message: 'Report submitted', reportId: report.id });
});

router.post(
  '/:postId/comments/:commentId/replies/:replyId/report',
  postMutationLimiter,
  requireAuth,
  async (req: AuthRequest, res) => {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);
    const replyId = validateId(req.params.replyId);
    if (!postId || !commentId || !replyId) {
      return res.status(400).json({ message: 'Invalid post, comment, or reply ID' });
    }

    const requesterId = String(req.user?.id);
    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid report payload' });
    }

    const { reporterId, reason } = parsed.data;
    if (String(reporterId) !== String(requesterId)) {
      return res.status(403).json({ message: 'Cannot report as another user' });
    }

    const post = db.posts.find((entry) => entry.id === postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.find((entry) => entry.id === commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.replies.find((entry) => entry.id === replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const reports = ensureModerationCollection();
    const report = createReport(
      'reply',
      reporterId,
      sanitizeText(reason, 500),
      postId,
      commentId,
      replyId
    );
    reports.push(report);
    applyAutoHideByThreshold(post, 'reply', commentId, replyId);
    await db.write();
    emitPostEvent('reply-reported', postId);
    return res.status(201).json({ message: 'Report submitted', reportId: report.id });
  }
);

router.get(
  '/moderation/reports',
  requireAuth,
  requireRole(['super_admin', 'moderator']),
  (_req: AuthRequest, res) => {
    const reports = ensureModerationCollection();
    const openReports = reports
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ items: openReports, total: openReports.length });
  }
);

const moderationUpdateSchema = z
  .object({
    reviewerId: z.union([z.number().int().positive(), z.string().min(1)]),
    status: z.enum(['open', 'reviewed', 'dismissed']),
    action: z.enum(['none', 'hide', 'restore']).default('none'),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

router.patch(
  '/moderation/reports/:reportId',
  postMutationLimiter,
  requireAuth,
  requireRole(['super_admin', 'moderator']),
  async (req: AuthRequest, res) => {
    const parsed = moderationUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid moderation update payload' });
    }

    const reportId = sanitizeText(req.params.reportId, 120);
    const reports = ensureModerationCollection();
    const report = reports.find((entry) => entry.id === reportId);
    if (!report) {
      return res.status(404).json({ message: 'Moderation report not found' });
    }

    const post = db.posts.find((entry) => entry.id === report.targetPostId);
    if (!post) {
      return res.status(404).json({ message: 'Target post not found' });
    }

    const { reviewerId, status, action, note } = parsed.data;
    if (report.targetType === 'post') {
      if (action === 'hide') post.hidden = true;
      if (action === 'restore') post.hidden = false;
    } else if (report.targetType === 'comment') {
      const comment = post.comments.find((entry) => entry.id === report.targetCommentId);
      if (comment) {
        if (action === 'hide') comment.hidden = true;
        if (action === 'restore') comment.hidden = false;
      }
    } else {
      const comment = post.comments.find((entry) => entry.id === report.targetCommentId);
      const reply = comment?.replies.find((entry) => entry.id === report.targetReplyId);
      if (reply) {
        if (action === 'hide') reply.hidden = true;
        if (action === 'restore') reply.hidden = false;
      }
    }

    report.status = status;
    report.updatedAt = new Date().toISOString();
    report.history.push({
      at: report.updatedAt,
      actorId: reviewerId as any,
      action: `moderation-${action}`,
      note,
    });

    await db.write();
    emitPostEvent('moderation-updated', report.targetPostId);
    return res.json({ message: 'Moderation report updated', report });
  }
);

export default router;
