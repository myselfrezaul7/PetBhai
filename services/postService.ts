import { safeStorage, safeSessionStorage } from '../lib/storage';
import type { Post, Comment, CommentReply, PaginatedPostsResponse } from '../types';
import { apiRequest, ApiRequestError } from './apiClient';

// Simple rate limiting - tracks timestamps per action type
const rateLimiters: Record<string, number[]> = {
  post: [],
  comment: [],
  like: [],
};

const RATE_LIMITS = {
  post: { max: 5, windowMs: 60000 }, // 5 posts per minute
  comment: { max: 20, windowMs: 60000 }, // 20 comments per minute
  like: { max: 60, windowMs: 60000 }, // 60 likes per minute
};

const QUEUED_MUTATIONS_KEY = 'petbhai_community_retry_queue';

type QueuedMutation =
  | {
      id: string;
      type: 'createPost';
      payload: {
        author: { id: number; name: string; profilePictureUrl?: string };
        content: string;
        imageUrl?: string;
      };
      createdAt: string;
    }
  | {
      id: string;
      type: 'togglePostLike';
      payload: { postId: number; userId: number };
      createdAt: string;
    }
  | {
      id: string;
      type: 'addComment';
      payload: {
        postId: number;
        author: { id: number; name: string; profilePictureUrl?: string };
        text: string;
      };
      createdAt: string;
    }
  | {
      id: string;
      type: 'addReply';
      payload: {
        postId: number;
        commentId: number;
        author: { id: number; name: string; profilePictureUrl?: string };
        text: string;
      };
      createdAt: string;
    };

const createIdempotencyKey = (): string => {
  return typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const readQueuedMutations = (): QueuedMutation[] => {
  try {
    const raw = safeStorage.getItem(QUEUED_MUTATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedMutation[]) : [];
  } catch {
    return [];
  }
};

const writeQueuedMutations = (queue: QueuedMutation[]): void => {
  try {
    safeStorage.setItem(QUEUED_MUTATIONS_KEY, JSON.stringify(queue.slice(-100)));
  } catch {
    // ignore safeStorage failures
  }
};

export const enqueueFailedMutation = (mutation: Omit<QueuedMutation, 'id' | 'createdAt'>): void => {
  const queue = readQueuedMutations();
  queue.push({
    ...mutation,
    id: createIdempotencyKey(),
    createdAt: new Date().toISOString(),
  } as QueuedMutation);
  writeQueuedMutations(queue);
};

export const flushQueuedMutations = async (): Promise<{ processed: number; remaining: number }> => {
  const queue = readQueuedMutations();
  if (queue.length === 0) {
    return { processed: 0, remaining: 0 };
  }

  const remaining: QueuedMutation[] = [];
  let processed = 0;

  for (const item of queue) {
    try {
      if (item.type === 'createPost') {
        await createPost(item.payload.author, item.payload.content, item.payload.imageUrl);
      } else if (item.type === 'togglePostLike') {
        await togglePostLike(item.payload.postId, item.payload.userId);
      } else if (item.type === 'addComment') {
        await addComment(item.payload.postId, item.payload.author, item.payload.text);
      } else if (item.type === 'addReply') {
        await addReply(
          item.payload.postId,
          item.payload.commentId,
          item.payload.author,
          item.payload.text
        );
      }
      processed += 1;
    } catch {
      remaining.push(item);
    }
  }

  writeQueuedMutations(remaining);
  return { processed, remaining: remaining.length };
};

const checkRateLimit = (action: keyof typeof RATE_LIMITS): boolean => {
  const now = Date.now();
  const limit = RATE_LIMITS[action];
  const timestamps = rateLimiters[action] || [];

  // Remove expired timestamps
  rateLimiters[action] = timestamps.filter((t) => now - t < limit.windowMs);

  if (rateLimiters[action].length >= limit.max) {
    return false;
  }

  rateLimiters[action].push(now);
  return true;
};

// Custom error class for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRateLimited: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Sanitize text input
const sanitizeText = (text: string, maxLength: number = 5000): string => {
  if (typeof text !== 'string') return '';
  // Remove null bytes and trim
  return text.replace(/\0/g, '').trim().slice(0, maxLength);
};

const toApiError = (error: unknown, fallbackMessage: string): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof ApiRequestError) {
    return new ApiError(error.message, error.statusCode, error.statusCode === 429);
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError(fallbackMessage);
};

// Get all posts
export const fetchPosts = async (): Promise<Post[]> => {
  try {
    const response = await apiRequest<PaginatedPostsResponse>('/posts/feed?limit=20', {
      method: 'GET',
    });
    const posts = response?.items || [];
    if (!Array.isArray(posts)) {
      throw new ApiError('Invalid response from server');
    }
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw toApiError(error, 'Failed to load posts. Please try again.');
  }
};

export const fetchPostsPage = async (
  cursor?: string,
  limit: number = 10
): Promise<PaginatedPostsResponse> => {
  const query = new URLSearchParams();
  query.set('limit', String(Math.min(Math.max(limit, 1), 30)));
  if (cursor) {
    query.set('cursor', cursor);
  }

  try {
    return await apiRequest<PaginatedPostsResponse>(`/posts/feed?${query.toString()}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Error fetching paginated posts:', error);
    throw toApiError(error, 'Failed to load posts. Please try again.');
  }
};

// Create a new post with rate limiting and validation
export const createPost = async (
  author: { id: number; name: string; profilePictureUrl?: string },
  content: string,
  imageUrl?: string
): Promise<Post> => {
  // Rate limiting
  if (!checkRateLimit('post')) {
    throw new ApiError("You're posting too fast! Please wait a moment.", 429, true);
  }

  // Validate content
  const sanitizedContent = sanitizeText(content, 5000);
  if (!sanitizedContent) {
    throw new ApiError('Post content cannot be empty');
  }

  try {
    return await apiRequest<Post>('/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': createIdempotencyKey(),
      },
      body: JSON.stringify({
        author: {
          id: Number(author.id),
          name: sanitizeText(author.name, 100),
          profilePictureUrl: author.profilePictureUrl,
        },
        content: sanitizedContent,
        imageUrl,
      }),
    });
  } catch (error) {
    console.error('Error creating post:', error);
    throw toApiError(error, 'Failed to create post. Please try again.');
  }
};

// Update a post
export const updatePost = async (
  postId: number,
  content: string,
  authorId: number
): Promise<Post> => {
  const sanitizedContent = sanitizeText(content, 5000);
  if (!sanitizedContent) {
    throw new ApiError('Post content cannot be empty');
  }

  try {
    return await apiRequest<Post>(`/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': createIdempotencyKey(),
      },
      body: JSON.stringify({ content: sanitizedContent, authorId: Number(authorId) }),
    });
  } catch (error) {
    console.error('Error updating post:', error);
    throw toApiError(error, 'Failed to update post. Please try again.');
  }
};

// Delete a post
export const deletePost = async (postId: number, _authorId: number): Promise<void> => {
  try {
    await apiRequest<void>(`/posts/${postId}`, { method: 'DELETE' });
  } catch (error) {
    console.error('Error deleting post:', error);
    throw toApiError(error, 'Failed to delete post. Please try again.');
  }
};

// Like/Unlike a post with rate limiting
export const togglePostLike = async (postId: number, userId: number): Promise<Post> => {
  if (!checkRateLimit('like')) {
    throw new ApiError("You're liking too fast! Please slow down.", 429, true);
  }

  try {
    return await apiRequest<Post>(`/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': createIdempotencyKey(),
      },
      body: JSON.stringify({ userId: Number(userId) }),
    });
  } catch (error) {
    console.error('Error toggling post like:', error);
    throw toApiError(error, 'Failed to update like. Please try again.');
  }
};

// Add a comment with rate limiting
export const addComment = async (
  postId: number,
  author: { id: number; name: string; profilePictureUrl?: string },
  text: string
): Promise<Comment> => {
  if (!checkRateLimit('comment')) {
    throw new ApiError("You're commenting too fast! Please slow down.", 429, true);
  }

  const sanitizedText = sanitizeText(text, 2000);
  if (!sanitizedText) {
    throw new ApiError('Comment cannot be empty');
  }

  try {
    return await apiRequest<Comment>(`/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': createIdempotencyKey(),
      },
      body: JSON.stringify({
        author: {
          id: Number(author.id),
          name: sanitizeText(author.name, 100),
          profilePictureUrl: author.profilePictureUrl,
        },
        text: sanitizedText,
      }),
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    throw toApiError(error, 'Failed to add comment. Please try again.');
  }
};

export const updateComment = async (
  postId: number,
  commentId: number,
  userId: number,
  text: string
): Promise<Comment> => {
  const sanitizedText = sanitizeText(text, 2000);
  if (!sanitizedText) {
    throw new ApiError('Comment cannot be empty');
  }

  try {
    return await apiRequest<Comment>(`/posts/${postId}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': createIdempotencyKey(),
      },
      body: JSON.stringify({ userId: Number(userId), text: sanitizedText }),
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw toApiError(error, 'Failed to update comment. Please try again.');
  }
};

export const deleteComment = async (
  postId: number,
  commentId: number,
  _userId: number
): Promise<void> => {
  try {
    await apiRequest<void>(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw toApiError(error, 'Failed to delete comment. Please try again.');
  }
};

// Like/Unlike a comment with rate limiting
export const toggleCommentLike = async (
  postId: number,
  commentId: number,
  userId: number
): Promise<Comment> => {
  if (!checkRateLimit('like')) {
    throw new ApiError("You're liking too fast! Please slow down.", 429, true);
  }

  try {
    return await apiRequest<Comment>(`/posts/${postId}/comments/${commentId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': createIdempotencyKey(),
      },
      body: JSON.stringify({ userId: Number(userId) }),
    });
  } catch (error) {
    console.error('Error toggling comment like:', error);
    throw toApiError(error, 'Failed to update like. Please try again.');
  }
};

// Add a reply with rate limiting
export const addReply = async (
  postId: number,
  commentId: number,
  author: { id: number; name: string; profilePictureUrl?: string },
  text: string
): Promise<CommentReply> => {
  if (!checkRateLimit('comment')) {
    throw new ApiError("You're replying too fast! Please slow down.", 429, true);
  }

  const sanitizedText = sanitizeText(text, 1000);
  if (!sanitizedText) {
    throw new ApiError('Reply cannot be empty');
  }

  try {
    return await apiRequest<CommentReply>(`/posts/${postId}/comments/${commentId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': createIdempotencyKey(),
      },
      body: JSON.stringify({
        author: {
          id: Number(author.id),
          name: sanitizeText(author.name, 100),
          profilePictureUrl: author.profilePictureUrl,
        },
        text: sanitizedText,
      }),
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    throw toApiError(error, 'Failed to add reply. Please try again.');
  }
};

export const updateReply = async (
  postId: number,
  commentId: number,
  replyId: number,
  userId: number,
  text: string
): Promise<CommentReply> => {
  const sanitizedText = sanitizeText(text, 1000);
  if (!sanitizedText) {
    throw new ApiError('Reply cannot be empty');
  }

  try {
    return await apiRequest<CommentReply>(
      `/posts/${postId}/comments/${commentId}/replies/${replyId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': createIdempotencyKey(),
        },
        body: JSON.stringify({ userId: Number(userId), text: sanitizedText }),
      }
    );
  } catch (error) {
    console.error('Error updating reply:', error);
    throw toApiError(error, 'Failed to update reply. Please try again.');
  }
};

export const deleteReply = async (
  postId: number,
  commentId: number,
  replyId: number,
  _userId: number
): Promise<void> => {
  try {
    await apiRequest<void>(`/posts/${postId}/comments/${commentId}/replies/${replyId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting reply:', error);
    throw toApiError(error, 'Failed to delete reply. Please try again.');
  }
};

// Like/Unlike a reply with rate limiting
export const toggleReplyLike = async (
  postId: number,
  commentId: number,
  replyId: number,
  userId: number
): Promise<CommentReply> => {
  if (!checkRateLimit('like')) {
    throw new ApiError("You're liking too fast! Please slow down.", 429, true);
  }

  try {
    return await apiRequest<CommentReply>(
      `/posts/${postId}/comments/${commentId}/replies/${replyId}/like`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': createIdempotencyKey(),
        },
        body: JSON.stringify({ userId: Number(userId) }),
      }
    );
  } catch (error) {
    console.error('Error toggling reply like:', error);
    throw toApiError(error, 'Failed to update like. Please try again.');
  }
};

const sanitizeReportReason = (reason: string): string => {
  return sanitizeText(reason, 500);
};

export const reportPost = async (
  postId: number,
  reporterId: number,
  reason: string
): Promise<void> => {
  const sanitizedReason = sanitizeReportReason(reason);
  if (!sanitizedReason || sanitizedReason.length < 3) {
    throw new ApiError('Please provide a valid report reason (minimum 3 characters).');
  }

  try {
    await apiRequest(`/posts/${postId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': createIdempotencyKey(),
      },
      body: JSON.stringify({ reporterId: Number(reporterId), reason: sanitizedReason }),
    });
  } catch (error) {
    console.error('Error reporting post:', error);
    throw toApiError(error, 'Failed to submit report. Please try again.');
  }
};

export const reportComment = async (
  postId: number,
  commentId: number,
  reporterId: number,
  reason: string
): Promise<void> => {
  const sanitizedReason = sanitizeReportReason(reason);
  if (!sanitizedReason || sanitizedReason.length < 3) {
    throw new ApiError('Please provide a valid report reason (minimum 3 characters).');
  }

  try {
    await apiRequest(`/posts/${postId}/comments/${commentId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': createIdempotencyKey(),
      },
      body: JSON.stringify({ reporterId: Number(reporterId), reason: sanitizedReason }),
    });
  } catch (error) {
    console.error('Error reporting comment:', error);
    throw toApiError(error, 'Failed to submit report. Please try again.');
  }
};

export const reportReply = async (
  postId: number,
  commentId: number,
  replyId: number,
  reporterId: number,
  reason: string
): Promise<void> => {
  const sanitizedReason = sanitizeReportReason(reason);
  if (!sanitizedReason || sanitizedReason.length < 3) {
    throw new ApiError('Please provide a valid report reason (minimum 3 characters).');
  }

  try {
    await apiRequest(`/posts/${postId}/comments/${commentId}/replies/${replyId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': createIdempotencyKey(),
      },
      body: JSON.stringify({ reporterId: Number(reporterId), reason: sanitizedReason }),
    });
  } catch (error) {
    console.error('Error reporting reply:', error);
    throw toApiError(error, 'Failed to submit report. Please try again.');
  }
};
