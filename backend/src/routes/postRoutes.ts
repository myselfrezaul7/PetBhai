import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import type { Post, Comment, CommentReply } from '../types';
import { postMutationLimiter } from '../middleware/rateLimiter';
import { securityLog } from '../middleware/logger';

const router = express.Router();
const liveClients = new Set<express.Response>();

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
      .max(7 * 1024 * 1024)
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
    // Sort by timestamp, newest first
    const sortedPosts = [...db.posts].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    res.json(sortedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
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
router.get('/:id', (req, res) => {
  try {
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
router.post('/', postMutationLimiter, (req, res) => {
  try {
    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid post payload' });
    }

    const { author, content, imageUrl } = parsed.data;

    const validatedAuthor = validateAuthor(author);
    if (!validatedAuthor) {
      return res.status(400).json({ message: 'Valid author information is required' });
    }

    const sanitizedContent = sanitizeText(content, 5000);
    if (!sanitizedContent) {
      return res.status(400).json({ message: 'Content is required' });
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
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

// Update a post
router.put('/:id', postMutationLimiter, (req, res) => {
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
router.delete('/:id', postMutationLimiter, (req, res) => {
  try {
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const authorId = validateId(req.query.authorId);
    if (!authorId) {
      return res.status(400).json({ message: 'Valid author ID is required' });
    }

    const postIndex = db.posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user is the author
    if (db.posts[postIndex].author.id !== authorId) {
      securityLog('POST_DELETE_FORBIDDEN', req, {
        postId,
        requesterId: authorId,
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
router.post('/:id/like', postMutationLimiter, (req, res) => {
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

    const post = db.posts.find((p) => p.id === postId);
    if (!post) {
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
    res.json(post);
  } catch (error) {
    console.error('Error toggling post like:', error);
    res.status(500).json({ message: 'Failed to toggle like' });
  }
});

// Add a comment to a post
router.post('/:id/comments', postMutationLimiter, (req, res) => {
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

    const sanitizedText = sanitizeText(text, 2000);
    if (!sanitizedText) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = db.posts.find((p) => p.id === postId);
    if (!post) {
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
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment' });
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

    const post = db.posts.find((p) => p.id === postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.find((c) => c.id === commentId);
    if (!comment) {
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

    const sanitizedText = sanitizeText(text, 1000);
    if (!sanitizedText) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const post = db.posts.find((p) => p.id === postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.find((c) => c.id === commentId);
    if (!comment) {
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
    res.status(201).json(newReply);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Failed to add reply' });
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

      const post = db.posts.find((p) => p.id === postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const comment = post.comments.find((c) => c.id === commentId);
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      const reply = comment.replies.find((r) => r.id === replyId);
      if (!reply) {
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
      res.json(reply);
    } catch (error) {
      console.error('Error toggling reply like:', error);
      res.status(500).json({ message: 'Failed to toggle like' });
    }
  }
);

export default router;
