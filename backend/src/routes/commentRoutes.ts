import express from 'express';
import { db } from '../db';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { postMutationLimiter } from '../middleware/rateLimiter';
import { securityLog } from '../middleware/logger';
import type { Comment, CommentReply } from '../types';
import {
  validateId,
  validateAuthor,
  ensureVerifiedUser,
  assertCooldown,
  COMMENT_COOLDOWN_MS,
  getIdempotencyCacheKey,
  getCachedIdempotentResponse,
  sanitizeText,
  emitPostEvent,
  setCachedIdempotentResponse,
  commentSchema,
  updateCommentSchema,
  userIdSchema,
  LIKE_COOLDOWN_MS,
  replySchema,
  updateReplySchema
} from './postHelpers';

const router = express.Router();

router.get('/:id(\\d+)/comments', async (req, res) => {
  try {
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = db.posts.find((entry) => entry.id === postId);
    if (!post || post.hidden) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const requestedLimit = Number.parseInt(String(req.query.limit || '20'), 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : '';

    const visibleComments = post.comments.filter((comment) => !comment.hidden);
    const startIndex = cursor
      ? Math.max(visibleComments.findIndex((comment) => String(comment.id) === cursor) + 1, 0)
      : 0;

    const items = visibleComments.slice(startIndex, startIndex + limit).map((comment) => ({
      ...comment,
      replies: comment.replies.filter((reply) => !reply.hidden),
    }));
    const nextItem = visibleComments[startIndex + limit];

    return res.json({
      items,
      nextCursor: nextItem ? String(items[items.length - 1]?.id ?? '') : null,
      hasMore: Boolean(nextItem),
    });
  } catch (error) {
    console.error('Error fetching paginated comments:', error);
    return res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// Add a comment to a post
router.post('/:id(\\d+)/comments', postMutationLimiter, requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const requesterId = String(req.user?.id);
    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid comment payload' });
    }

    const { author, text } = parsed.data;
    const validatedAuthor = validateAuthor(author);
    if (!validatedAuthor) {
      return res.status(400).json({ message: 'Valid author information is required' });
    }

    if (validatedAuthor.id !== requesterId) {
      return res.status(403).json({ message: 'Cannot comment as another user' });
    }

    const verification = ensureVerifiedUser(validatedAuthor.id);
    if (!verification.ok) {
      return res.status(403).json({ message: verification.message });
    }

    const cooldownResult = assertCooldown(`comment:${validatedAuthor.id}`, COMMENT_COOLDOWN_MS);
    if (!cooldownResult.ok) {
      return res.status(429).json({
        message: 'Commenting too fast. Please wait before commenting again.',
      });
    }

    const cacheKey = getIdempotencyCacheKey(req, Number(validatedAuthor.id));
    const cachedResponse = getCachedIdempotentResponse(cacheKey);
    if (cachedResponse) {
      return res.status(cachedResponse.status).json(cachedResponse.payload);
    }

    const sanitizedText = sanitizeText(text, 2000);
    if (!sanitizedText) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = db.posts.find((p) => p.id === postId);
    if (!post || post.hidden) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment: Comment = {
      id: Date.now(),
      author: validatedAuthor,
      text: sanitizedText,
      replies: [],
      likes: [],
      timestamp: new Date().toISOString(),
    };

    post.comments.push(newComment);
    await db.write();
    emitPostEvent('comment-created', postId);
    setCachedIdempotentResponse(cacheKey, 201, newComment);
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

router.put('/:postId/comments/:commentId', postMutationLimiter, requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);
    if (!postId || !commentId) {
      return res.status(400).json({ message: 'Invalid post or comment ID' });
    }

    const requesterId = String(req.user?.id);
    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const parsed = updateCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid comment update payload' });
    }

    const userId = String(parsed.data.userId);
    if (!userId || userId !== requesterId) {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }

    const post = db.posts.find((entry) => entry.id === postId);
    if (!post || post.hidden) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.find((entry) => entry.id === commentId);
    if (!comment || comment.hidden) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.id !== userId) {
      securityLog('COMMENT_EDIT_FORBIDDEN', req, {
        postId,
        commentId,
        requesterId: userId,
        ownerId: comment.author.id,
      });
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    const sanitizedText = sanitizeText(parsed.data.text, 2000);
    if (!sanitizedText) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    comment.text = sanitizedText;
    await db.write();
    emitPostEvent('comment-updated', postId);
    return res.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).json({ message: 'Failed to update comment' });
  }
});

router.delete(
  '/:postId/comments/:commentId',
  requireAuth,
  postMutationLimiter,
  async (req: AuthRequest, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);
    const userId = String(req.user?.id);

    if (!postId || !commentId) {
      return res.status(400).json({ message: 'Invalid post or comment ID' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }

    const post = db.posts.find((entry) => entry.id === postId);
    if (!post || post.hidden) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const commentIndex = post.comments.findIndex((entry) => entry.id === commentId);
    if (commentIndex === -1 || post.comments[commentIndex].hidden) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (post.comments[commentIndex].author.id !== userId) {
      securityLog('COMMENT_DELETE_FORBIDDEN', req, {
        postId,
        commentId,
        requesterId: userId,
        ownerId: post.comments[commentIndex].author.id,
      });
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    post.comments.splice(commentIndex, 1);
    await db.write();
    emitPostEvent('comment-deleted', postId);
    return res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ message: 'Failed to delete comment' });
  }
});

// Like/Unlike a comment
router.post('/:postId/comments/:commentId/like', postMutationLimiter, requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);
    const parsed = userIdSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }

    const requesterId = String(req.user?.id);
    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = String(parsed.data.userId);

    if (!postId || !commentId) {
      return res.status(400).json({ message: 'Invalid post or comment ID' });
    }
    if (!userId || userId !== requesterId) {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }

    const verification = ensureVerifiedUser(userId);
    if (!verification.ok) {
      return res.status(403).json({ message: verification.message });
    }

    const cooldownResult = assertCooldown(`like:comment:${userId}`, LIKE_COOLDOWN_MS);
    if (!cooldownResult.ok) {
      return res.status(429).json({ message: 'You are reacting too fast. Please slow down.' });
    }

    const cacheKey = getIdempotencyCacheKey(req, Number(userId));
    const cachedResponse = getCachedIdempotentResponse(cacheKey);
    if (cachedResponse) {
      return res.status(cachedResponse.status).json(cachedResponse.payload);
    }

    const post = db.posts.find((p) => p.id === postId);
    if (!post || post.hidden) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.find((c) => c.id === commentId);
    if (!comment || comment.hidden) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const likeIndex = comment.likes.indexOf(Number(userId));
    if (likeIndex === -1) {
      comment.likes.push(Number(userId));
    } else {
      comment.likes.splice(likeIndex, 1);
    }

    await db.write();
    emitPostEvent('comment-liked', postId);
    setCachedIdempotentResponse(cacheKey, 200, comment);
    res.json(comment);
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ message: 'Failed to toggle like' });
  }
});

// Add a reply to a comment
router.post('/:postId/comments/:commentId/replies', postMutationLimiter, requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);

    if (!postId || !commentId) {
      return res.status(400).json({ message: 'Invalid post or comment ID' });
    }

    const requesterId = String(req.user?.id);
    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const parsed = replySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid reply payload' });
    }

    const { author, text } = parsed.data;
    const validatedAuthor = validateAuthor(author);
    if (!validatedAuthor || validatedAuthor.id !== requesterId) {
      return res.status(400).json({ message: 'Valid author information is required and must match user' });
    }

    const verification = ensureVerifiedUser(validatedAuthor.id);
    if (!verification.ok) {
      return res.status(403).json({ message: verification.message });
    }

    const cooldownResult = assertCooldown(`reply:${validatedAuthor.id}`, COMMENT_COOLDOWN_MS);
    if (!cooldownResult.ok) {
      return res
        .status(429)
        .json({ message: 'Replying too fast. Please wait before replying again.' });
    }

    const cacheKey = getIdempotencyCacheKey(req, Number(validatedAuthor.id));
    const cachedResponse = getCachedIdempotentResponse(cacheKey);
    if (cachedResponse) {
      return res.status(cachedResponse.status).json(cachedResponse.payload);
    }

    const sanitizedText = sanitizeText(text, 1000);
    if (!sanitizedText) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const post = db.posts.find((p) => p.id === postId);
    if (!post || post.hidden) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.find((c) => c.id === commentId);
    if (!comment || comment.hidden) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const newReply: CommentReply = {
      id: Date.now(),
      author: validatedAuthor,
      text: sanitizedText,
      likes: [],
      timestamp: new Date().toISOString(),
    };

    comment.replies.push(newReply);
    await db.write();
    emitPostEvent('reply-created', postId);
    setCachedIdempotentResponse(cacheKey, 201, newReply);
    res.status(201).json(newReply);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Failed to add reply' });
  }
});

router.put('/:postId/comments/:commentId/replies/:replyId', postMutationLimiter, requireAuth, async (req: AuthRequest, res) => {
  try {
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

    const parsed = updateReplySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid reply update payload' });
    }

    const userId = String(parsed.data.userId);
    if (!userId || userId !== requesterId) {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }

    const post = db.posts.find((entry) => entry.id === postId);
    if (!post || post.hidden) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.find((entry) => entry.id === commentId);
    if (!comment || comment.hidden) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.replies.find((entry) => entry.id === replyId);
    if (!reply || reply.hidden) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (reply.author.id !== userId) {
      securityLog('REPLY_EDIT_FORBIDDEN', req, {
        postId,
        commentId,
        replyId,
        requesterId: userId,
        ownerId: reply.author.id,
      });
      return res.status(403).json({ message: 'You can only edit your own replies' });
    }

    const sanitizedText = sanitizeText(parsed.data.text, 1000);
    if (!sanitizedText) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    reply.text = sanitizedText;
    await db.write();
    emitPostEvent('reply-updated', postId);
    return res.json(reply);
  } catch (error) {
    console.error('Error updating reply:', error);
    return res.status(500).json({ message: 'Failed to update reply' });
  }
});

router.delete(
  '/:postId/comments/:commentId/replies/:replyId',
  requireAuth,
  postMutationLimiter,
  async (req: AuthRequest, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);
    const replyId = validateId(req.params.replyId);
    const userId = String(req.user?.id);

    if (!postId || !commentId || !replyId) {
      return res.status(400).json({ message: 'Invalid post, comment, or reply ID' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }

    const post = db.posts.find((entry) => entry.id === postId);
    if (!post || post.hidden) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.find((entry) => entry.id === commentId);
    if (!comment || comment.hidden) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const replyIndex = comment.replies.findIndex((entry) => entry.id === replyId);
    if (replyIndex === -1 || comment.replies[replyIndex].hidden) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (comment.replies[replyIndex].author.id !== userId) {
      securityLog('REPLY_DELETE_FORBIDDEN', req, {
        postId,
        commentId,
        replyId,
        requesterId: userId,
        ownerId: comment.replies[replyIndex].author.id,
      });
      return res.status(403).json({ message: 'You can only delete your own replies' });
    }

    comment.replies.splice(replyIndex, 1);
    await db.write();
    emitPostEvent('reply-deleted', postId);
    return res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Error deleting reply:', error);
    return res.status(500).json({ message: 'Failed to delete reply' });
  }
});

// Like/Unlike a reply
router.post(
  '/:postId/comments/:commentId/replies/:replyId/like',
  postMutationLimiter,
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const postId = validateId(req.params.postId);
      const commentId = validateId(req.params.commentId);
      const replyId = validateId(req.params.replyId);
      const parsed = userIdSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Valid user ID is required' });
      }

      const requesterId = String(req.user?.id);
      if (!requesterId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userId = String(parsed.data.userId);

      if (!postId || !commentId || !replyId) {
        return res.status(400).json({ message: 'Invalid post, comment, or reply ID' });
      }
      if (!userId || userId !== requesterId) {
        return res.status(400).json({ message: 'Valid user ID is required' });
      }

      const verification = ensureVerifiedUser(userId);
      if (!verification.ok) {
        return res.status(403).json({ message: verification.message });
      }

      const cooldownResult = assertCooldown(`like:reply:${userId}`, LIKE_COOLDOWN_MS);
      if (!cooldownResult.ok) {
        return res.status(429).json({ message: 'You are reacting too fast. Please slow down.' });
      }

      const cacheKey = getIdempotencyCacheKey(req, Number(userId));
      const cachedResponse = getCachedIdempotentResponse(cacheKey);
      if (cachedResponse) {
        return res.status(cachedResponse.status).json(cachedResponse.payload);
      }

      const post = db.posts.find((p) => p.id === postId);
      if (!post || post.hidden) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const comment = post.comments.find((c) => c.id === commentId);
      if (!comment || comment.hidden) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      const reply = comment.replies.find((r) => r.id === replyId);
      if (!reply || reply.hidden) {
        return res.status(404).json({ message: 'Reply not found' });
      }

      const likeIndex = reply.likes.indexOf(Number(userId));
      if (likeIndex === -1) {
        reply.likes.push(Number(userId));
      } else {
        reply.likes.splice(likeIndex, 1);
      }

      await db.write();
      emitPostEvent('reply-liked', postId);
      setCachedIdempotentResponse(cacheKey, 200, reply);
      res.json(reply);
    } catch (error) {
      console.error('Error toggling reply like:', error);
      res.status(500).json({ message: 'Failed to toggle like' });
    }
  }
);

export default router;
