import express from 'express';
import { db } from '../db';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { postMutationLimiter } from '../middleware/rateLimiter';
import { securityLog } from '../middleware/logger';
import type { Post } from '../types';
import {
  getSortedVisiblePosts,
  liveClients,
  validateId,
  ensurePostsCollection,
  createPostSchema,
  validateAuthor,
  ensureVerifiedUser,
  assertCooldown,
  POST_COOLDOWN_MS,
  sanitizeText,
  countLinks,
  MAX_LINKS_PER_POST,
  getIdempotencyCacheKey,
  getCachedIdempotentResponse,
  assertMediaRate,
  emitPostEvent,
  setCachedIdempotentResponse,
  updatePostSchema,
  userIdSchema,
  LIKE_COOLDOWN_MS,
} from './postHelpers';

const router = express.Router();

// Get all posts
router.get('/', (_req, res) => {
  try {
    res.json(getSortedVisiblePosts());
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

router.get('/feed', async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(String(req.query.limit || '10'), 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 30) : 10;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : '';

    let sortedPosts = getSortedVisiblePosts();
    if (req.query.authorId) {
      const authorId = Number(req.query.authorId);
      sortedPosts = sortedPosts.filter(p => p.author.id === authorId);
    }
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
router.get('/stream', async (req, res) => {
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
router.get('/:id(\\d+)', async (req, res) => {
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

// Create a new post
router.post('/', postMutationLimiter, requireAuth, async (req: AuthRequest, res) => {
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

    const requesterId = String(req.user?.id);
    if (!requesterId || requesterId !== validatedAuthor.id) {
      return res.status(403).json({ message: 'You cannot post as another user' });
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

    const cacheKey = getIdempotencyCacheKey(req, Number(validatedAuthor.id));
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
    await db.write();
    emitPostEvent('post-created', newPost.id);
    setCachedIdempotentResponse(cacheKey, 201, newPost);
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

// Update a post
router.put('/:id(\\d+)', postMutationLimiter, requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const requesterId = String(req.user?.id);
    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const parsed = updatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid post update payload' });
    }

    const { content, authorId } = parsed.data;
    const validAuthorId = String(authorId);
    if (!validAuthorId || validAuthorId !== requesterId) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
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
    await db.write();
    emitPostEvent('post-updated', postId);
    res.json(db.posts[postIndex]);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
});

// Delete a post
router.delete('/:id(\\d+)', requireAuth, postMutationLimiter, async (req: AuthRequest, res) => {
  try {
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const requesterId = String(req.user?.id);
    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const postIndex = db.posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user is the author
    if (Number(db.posts[postIndex].author.id) !== Number(requesterId)) {
      securityLog('POST_DELETE_FORBIDDEN', req, {
        postId,
        requesterId,
        ownerId: db.posts[postIndex].author.id,
      });
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    db.posts.splice(postIndex, 1);
    await db.write();
    emitPostEvent('post-deleted', postId);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

// Like/Unlike a post
router.post('/:id(\\d+)/like', postMutationLimiter, requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const requesterId = String(req.user?.id);
    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const parsed = userIdSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }

    const userId = String(parsed.data.userId);
    if (!userId || userId !== requesterId) {
      return res.status(403).json({ message: 'Cannot react as another user' });
    }

    const verification = ensureVerifiedUser(userId);
    if (!verification.ok) {
      return res.status(403).json({ message: verification.message });
    }

    const cooldownResult = assertCooldown(`like:post:${userId}`, LIKE_COOLDOWN_MS);
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

    const likeIndex = post.likes.indexOf(Number(userId));
    if (likeIndex === -1) {
      post.likes.push(Number(userId));
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await db.write();
    emitPostEvent('post-liked', postId);
    setCachedIdempotentResponse(cacheKey, 200, post);
    res.json(post);
  } catch (error) {
    console.error('Error toggling post like:', error);
    res.status(500).json({ message: 'Failed to toggle like' });
  }
});

export default router;
