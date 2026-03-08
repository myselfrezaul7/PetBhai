import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import type { Post, Comment, CommentReply, ModerationReport, User } from '../types';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { postMutationLimiter } from '../middleware/rateLimiter';
import { securityLog } from '../middleware/logger';

const router = express.Router();
const liveClients = new Set<express.Response>();
const REPORT_HIDE_THRESHOLD = 3;
const POST_COOLDOWN_MS = 15_000;
const COMMENT_COOLDOWN_MS = 5_000;
const LIKE_COOLDOWN_MS = 500;
const MAX_LINKS_PER_POST = 3;
const MAX_IMAGE_POSTS_PER_MINUTE = 4;
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;
const MAX_STORED_POSTS = 500;
const POST_AGE_LIMIT_MS = 90 * 24 * 60 * 60 * 1000;

const cooldownTracker = new Map<string, number>();
const mediaRateTracker = new Map<string, number[]>();
const idempotencyStore = new Map<string, { status: number; payload: unknown; expiresAt: number }>();

const ensurePostsCollection = (): void => {
  if (!Array.isArray(db.data.posts)) {
    db.data.posts = [];
  }
};

const cleanupOldPosts = (): void => {
  ensurePostsCollection();

  const now = Date.now();
  const originalLength = db.data.posts.length;

  db.data.posts = db.data.posts.filter((post) => {
    const postTime = new Date(post.timestamp).getTime();
    if (!Number.isFinite(postTime)) {
      return false;
    }
    return now - postTime <= POST_AGE_LIMIT_MS;
  });

  if (db.data.posts.length > MAX_STORED_POSTS) {
    db.data.posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    db.data.posts = db.data.posts.slice(0, MAX_STORED_POSTS);
  }

  if (db.data.posts.length < originalLength) {
    db.write();
  }
};

cleanupOldPosts();

const ensureModerationCollection = (): ModerationReport[] => {
  const record = db.data as unknown as Record<string, unknown>;
  if (!Array.isArray(record.moderationReports)) {
    record.moderationReports = [];
  }
  return record.moderationReports as ModerationReport[];
};

const filterVisiblePost = (post: Post): Post | null => {
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

const getSortedVisiblePosts = (): Post[] => {
  ensurePostsCollection();
  return [...db.posts]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map(filterVisiblePost)
    .filter((post): post is Post => post !== null);
};

const resolveUserById = (userId: number): User | null => {
  const user = db.users.find((record) => Number(record.id) === Number(userId));
  return user || null;
};

type UserCommunityMetadata = User & {
  emailVerified?: boolean;
};

const userWithCommunityMetadata = (user: User): UserCommunityMetadata => {
  return user as UserCommunityMetadata;
};

const ensureVerifiedUser = (userId: number): { ok: true } | { ok: false; message: string } => {
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

const assertCooldown = (
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

const countLinks = (text: string): number => {
  const linkMatches = text.match(/https?:\/\//gi);
  return linkMatches ? linkMatches.length : 0;
};

const assertMediaRate = (userId: number): { ok: true } | { ok: false; message: string } => {
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

const cleanupIdempotencyStore = (): void => {
  const now = Date.now();
  for (const [key, value] of idempotencyStore.entries()) {
    if (value.expiresAt <= now) {
      idempotencyStore.delete(key);
    }
  }
};

const getIdempotencyCacheKey = (req: express.Request, actorId: number | null): string | null => {
  const key = req.get('X-Idempotency-Key');
  if (!key || key.trim().length < 8) {
    return null;
  }

  const actor = actorId ?? 'anonymous';
  return `${req.method}:${req.path}:${actor}:${key.trim()}`;
};

const getCachedIdempotentResponse = (
  cacheKey: string | null
): { status: number; payload: unknown } | null => {
  if (!cacheKey) return null;
  cleanupIdempotencyStore();
  const cached = idempotencyStore.get(cacheKey);
  if (!cached) return null;
  return { status: cached.status, payload: cached.payload };
};

const setCachedIdempotentResponse = (
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

const createReport = (
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

const applyAutoHideByThreshold = (
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

const emitPostEvent = (eventType: string, postId?: number): void => {
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

const authorSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().min(1).max(100),
    profilePictureUrl: z.string().max(3000).optional(),
  })
  .strict();

const createPostSchema = z
  .object({
    author: authorSchema,
    content: z.string().min(1).max(5000),
    imageUrl: z
      .string()
      .max(3 * 1024 * 1024)
      .optional(),
  })
  .strict();

const updatePostSchema = z
  .object({
    content: z.string().min(1).max(5000),
    authorId: z.number().int().positive(),
  })
  .strict();

const userIdSchema = z
  .object({
    userId: z.number().int().positive(),
  })
  .strict();

const commentSchema = z
  .object({
    author: authorSchema,
    text: z.string().min(1).max(2000),
  })
  .strict();

const replySchema = z
  .object({
    author: authorSchema,
    text: z.string().min(1).max(1000),
  })
  .strict();

const updateCommentSchema = z
  .object({
    userId: z.number().int().positive(),
    text: z.string().min(1).max(2000),
  })
  .strict();

const updateReplySchema = z
  .object({
    userId: z.number().int().positive(),
    text: z.string().min(1).max(1000),
  })
  .strict();
// Security: Sanitize text input
const sanitizeText = (text: unknown, maxLength: number = 5000): string => {
  if (typeof text !== 'string') return '';
  return text.replace(/\0/g, '').trim().slice(0, maxLength);
};

// Security: Validate positive integer ID
const validateId = (id: unknown): number | null => {
  const num = parseInt(String(id), 10);
  return Number.isFinite(num) && num > 0 ? num : null;
};

// Security: Validate author object
const validateAuthor = (
  author: unknown
): { id: number; name: string; profilePictureUrl?: string } | null => {
  if (!author || typeof author !== 'object') return null;
  const a = author as Record<string, unknown>;

  const id = validateId(a.id);
  if (!id) return null;

  const name = sanitizeText(a.name, 100);
  if (!name) return null;

  return {
    id,
    name,
    profilePictureUrl: typeof a.profilePictureUrl === 'string' ? a.profilePictureUrl : undefined,
  };
};

// Get all posts
router.get('/', (_req, res) => {
  try {
    res.json(getSortedVisiblePosts());
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

router.get('/feed', (req, res) => {
  try {
    const requestedLimit = Number.parseInt(String(req.query.limit || '10'), 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 30) : 10;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : '';

    const sortedPosts = getSortedVisiblePosts();
    const startIndex = cursor
      ? Math.max(sortedPosts.findIndex((post) => String(post.id) === cursor) + 1, 0)
      : 0;

    const items = sortedPosts.slice(startIndex, startIndex + limit);
    const nextItem = sortedPosts[startIndex + limit];

    res.json({
      items,
      nextCursor: nextItem ? String(items[items.length - 1]?.id ?? '') : null,
      hasMore: Boolean(nextItem),
    });
  } catch (error) {
    console.error('Error fetching paginated posts:', error);
    res.status(500).json({ message: 'Failed to fetch feed' });
  }
});

// Real-time post update stream (SSE)
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);

  liveClients.add(res);

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': ping\n\n');
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    liveClients.delete(res);
    res.end();
  });
});

// Get single post
router.get('/:id(\\d+)', (req, res) => {
  try {
    ensurePostsCollection();
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = db.posts.find((p) => p.id === postId);
    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
});

router.get('/:id(\\d+)/comments', (req, res) => {
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

// Create a new post
router.post('/', postMutationLimiter, (req, res) => {
  try {
    ensurePostsCollection();
    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid post payload' });
    }

    const { author, content, imageUrl } = parsed.data;

    const validatedAuthor = validateAuthor(author);
    if (!validatedAuthor) {
      return res.status(400).json({ message: 'Valid author information is required' });
    }

    const verification = ensureVerifiedUser(validatedAuthor.id);
    if (!verification.ok) {
      return res.status(403).json({ message: verification.message });
    }

    const cooldownResult = assertCooldown(`post:${validatedAuthor.id}`, POST_COOLDOWN_MS);
    if (!cooldownResult.ok) {
      return res.status(429).json({
        message: 'Posting too fast. Please wait before creating another post.',
        retryAfterMs: cooldownResult.retryAfterMs,
      });
    }

    const sanitizedContent = sanitizeText(content, 5000);
    if (!sanitizedContent) {
      return res.status(400).json({ message: 'Content is required' });
    }

    if (countLinks(sanitizedContent) > MAX_LINKS_PER_POST) {
      return res
        .status(400)
        .json({ message: 'Too many links in one post. Please keep it concise.' });
    }

    const cacheKey = getIdempotencyCacheKey(req, validatedAuthor.id);
    const cachedResponse = getCachedIdempotentResponse(cacheKey);
    if (cachedResponse) {
      return res.status(cachedResponse.status).json(cachedResponse.payload);
    }

    // Validate image URL if provided
    let validImageUrl: string | undefined;
    if (imageUrl) {
      if (typeof imageUrl !== 'string') {
        return res.status(400).json({ message: 'Invalid image URL format' });
      }
      // Check image size (base64 estimation)
      if (imageUrl.length > 7 * 1024 * 1024) {
        return res.status(400).json({ message: 'Image size exceeds 5MB limit' });
      }
      // Only allow data URLs or https URLs
      if (!imageUrl.startsWith('data:image/') && !imageUrl.startsWith('https://')) {
        return res.status(400).json({ message: 'Invalid image URL' });
      }
      validImageUrl = imageUrl;

      const mediaRateResult = assertMediaRate(validatedAuthor.id);
      if (!mediaRateResult.ok) {
        return res.status(429).json({ message: mediaRateResult.message });
      }
    }

    const newPost: Post = {
      id: Date.now(),
      author: validatedAuthor,
      content: sanitizedContent,
      imageUrl: validImageUrl,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
    };

    db.posts.unshift(newPost);
    db.write();
    emitPostEvent('post-created', newPost.id);
    setCachedIdempotentResponse(cacheKey, 201, newPost);
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

// Update a post
router.put('/:id(\\d+)', postMutationLimiter, (req, res) => {
  try {
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const parsed = updatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid post update payload' });
    }

    const { content, authorId } = parsed.data;
    const validAuthorId = validateId(authorId);
    if (!validAuthorId) {
      return res.status(400).json({ message: 'Valid author ID is required' });
    }

    const sanitizedContent = sanitizeText(content, 5000);
    if (!sanitizedContent) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const postIndex = db.posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user is the author
    if (db.posts[postIndex].author.id !== validAuthorId) {
      securityLog('POST_EDIT_FORBIDDEN', req, {
        postId,
        requesterId: validAuthorId,
        ownerId: db.posts[postIndex].author.id,
      });
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }

    db.posts[postIndex] = { ...db.posts[postIndex], content: sanitizedContent };
    db.write();
    emitPostEvent('post-updated', postId);
    res.json(db.posts[postIndex]);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
});

// Delete a post
router.delete('/:id(\\d+)', requireAuth, postMutationLimiter, (req: AuthRequest, res) => {
  try {
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const requesterId = validateId(req.user?.id);
    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const postIndex = db.posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user is the author
    if (Number(db.posts[postIndex].author.id) !== requesterId) {
      securityLog('POST_DELETE_FORBIDDEN', req, {
        postId,
        requesterId,
        ownerId: db.posts[postIndex].author.id,
      });
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    db.posts.splice(postIndex, 1);
    db.write();
    emitPostEvent('post-deleted', postId);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

// Like/Unlike a post
router.post('/:id(\\d+)/like', postMutationLimiter, (req, res) => {
  try {
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const parsed = userIdSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }

    const userId = validateId(parsed.data.userId);
    if (!userId) {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }

    const verification = ensureVerifiedUser(userId);
    if (!verification.ok) {
      return res.status(403).json({ message: verification.message });
    }

    const cooldownResult = assertCooldown(`like:post:${userId}`, LIKE_COOLDOWN_MS);
    if (!cooldownResult.ok) {
      return res.status(429).json({ message: 'You are reacting too fast. Please slow down.' });
    }

    const cacheKey = getIdempotencyCacheKey(req, userId);
    const cachedResponse = getCachedIdempotentResponse(cacheKey);
    if (cachedResponse) {
      return res.status(cachedResponse.status).json(cachedResponse.payload);
    }

    const post = db.posts.find((p) => p.id === postId);
    if (!post || post.hidden) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    db.write();
    emitPostEvent('post-liked', postId);
    setCachedIdempotentResponse(cacheKey, 200, post);
    res.json(post);
  } catch (error) {
    console.error('Error toggling post like:', error);
    res.status(500).json({ message: 'Failed to toggle like' });
  }
});

// Add a comment to a post
router.post('/:id(\\d+)/comments', postMutationLimiter, (req, res) => {
  try {
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
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

    const cacheKey = getIdempotencyCacheKey(req, validatedAuthor.id);
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
    db.write();
    emitPostEvent('comment-created', postId);
    setCachedIdempotentResponse(cacheKey, 201, newComment);
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

router.put('/:postId/comments/:commentId', postMutationLimiter, (req, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);
    if (!postId || !commentId) {
      return res.status(400).json({ message: 'Invalid post or comment ID' });
    }

    const parsed = updateCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid comment update payload' });
    }

    const userId = validateId(parsed.data.userId);
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
    db.write();
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
  (req: AuthRequest, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);
    const userId = validateId(req.user?.id);

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
    db.write();
    emitPostEvent('comment-deleted', postId);
    return res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ message: 'Failed to delete comment' });
  }
});

// Like/Unlike a comment
router.post('/:postId/comments/:commentId/like', postMutationLimiter, (req, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);
    const parsed = userIdSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }

    const userId = validateId(parsed.data.userId);

    if (!postId || !commentId) {
      return res.status(400).json({ message: 'Invalid post or comment ID' });
    }
    if (!userId) {
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

    const cacheKey = getIdempotencyCacheKey(req, userId);
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

    const likeIndex = comment.likes.indexOf(userId);
    if (likeIndex === -1) {
      comment.likes.push(userId);
    } else {
      comment.likes.splice(likeIndex, 1);
    }

    db.write();
    emitPostEvent('comment-liked', postId);
    setCachedIdempotentResponse(cacheKey, 200, comment);
    res.json(comment);
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ message: 'Failed to toggle like' });
  }
});

// Add a reply to a comment
router.post('/:postId/comments/:commentId/replies', postMutationLimiter, (req, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);

    if (!postId || !commentId) {
      return res.status(400).json({ message: 'Invalid post or comment ID' });
    }

    const parsed = replySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid reply payload' });
    }

    const { author, text } = parsed.data;
    const validatedAuthor = validateAuthor(author);
    if (!validatedAuthor) {
      return res.status(400).json({ message: 'Valid author information is required' });
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

    const cacheKey = getIdempotencyCacheKey(req, validatedAuthor.id);
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
    db.write();
    emitPostEvent('reply-created', postId);
    setCachedIdempotentResponse(cacheKey, 201, newReply);
    res.status(201).json(newReply);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Failed to add reply' });
  }
});

router.put('/:postId/comments/:commentId/replies/:replyId', postMutationLimiter, (req, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);
    const replyId = validateId(req.params.replyId);

    if (!postId || !commentId || !replyId) {
      return res.status(400).json({ message: 'Invalid post, comment, or reply ID' });
    }

    const parsed = updateReplySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid reply update payload' });
    }

    const userId = validateId(parsed.data.userId);
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
    db.write();
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
  (req: AuthRequest, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);
    const replyId = validateId(req.params.replyId);
    const userId = validateId(req.user?.id);

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
    db.write();
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
  (req, res) => {
    try {
      const postId = validateId(req.params.postId);
      const commentId = validateId(req.params.commentId);
      const replyId = validateId(req.params.replyId);
      const parsed = userIdSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Valid user ID is required' });
      }

      const userId = validateId(parsed.data.userId);

      if (!postId || !commentId || !replyId) {
        return res.status(400).json({ message: 'Invalid post, comment, or reply ID' });
      }
      if (!userId) {
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

      const cacheKey = getIdempotencyCacheKey(req, userId);
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

      const likeIndex = reply.likes.indexOf(userId);
      if (likeIndex === -1) {
        reply.likes.push(userId);
      } else {
        reply.likes.splice(likeIndex, 1);
      }

      db.write();
      emitPostEvent('reply-liked', postId);
      setCachedIdempotentResponse(cacheKey, 200, reply);
      res.json(reply);
    } catch (error) {
      console.error('Error toggling reply like:', error);
      res.status(500).json({ message: 'Failed to toggle like' });
    }
  }
);

const reportSchema = z
  .object({
    reporterId: z.number().int().positive(),
    reason: z.string().trim().min(3).max(500),
  })
  .strict();

router.post('/:id(\\d+)/report', postMutationLimiter, (req, res) => {
  const postId = validateId(req.params.id);
  if (!postId) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid report payload' });
  }

  const { reporterId, reason } = parsed.data;
  const post = db.posts.find((entry) => entry.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const reports = ensureModerationCollection();
  const report = createReport('post', reporterId, sanitizeText(reason, 500), postId);
  reports.push(report);
  applyAutoHideByThreshold(post, 'post');
  db.write();
  emitPostEvent('post-reported', postId);
  return res.status(201).json({ message: 'Report submitted', reportId: report.id });
});

router.post('/:postId/comments/:commentId/report', postMutationLimiter, (req, res) => {
  const postId = validateId(req.params.postId);
  const commentId = validateId(req.params.commentId);
  if (!postId || !commentId) {
    return res.status(400).json({ message: 'Invalid post or comment ID' });
  }

  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid report payload' });
  }

  const { reporterId, reason } = parsed.data;
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
  db.write();
  emitPostEvent('comment-reported', postId);
  return res.status(201).json({ message: 'Report submitted', reportId: report.id });
});

router.post(
  '/:postId/comments/:commentId/replies/:replyId/report',
  postMutationLimiter,
  (req, res) => {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);
    const replyId = validateId(req.params.replyId);
    if (!postId || !commentId || !replyId) {
      return res.status(400).json({ message: 'Invalid post, comment, or reply ID' });
    }

    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid report payload' });
    }

    const { reporterId, reason } = parsed.data;
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
    db.write();
    emitPostEvent('reply-reported', postId);
    return res.status(201).json({ message: 'Report submitted', reportId: report.id });
  }
);

router.get('/moderation/reports', (_req, res) => {
  const reports = ensureModerationCollection();
  const openReports = reports
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ items: openReports, total: openReports.length });
});

const moderationUpdateSchema = z
  .object({
    reviewerId: z.number().int().positive(),
    status: z.enum(['open', 'reviewed', 'dismissed']),
    action: z.enum(['none', 'hide', 'restore']).default('none'),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

router.patch('/moderation/reports/:reportId', postMutationLimiter, (req, res) => {
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
    actorId: reviewerId,
    action: `moderation-${action}`,
    note,
  });

  db.write();
  emitPostEvent('moderation-updated', report.targetPostId);
  return res.json({ message: 'Moderation report updated', report });
});

export default router;
