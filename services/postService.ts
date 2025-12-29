import type { Post, Comment, CommentReply } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

// Helper for fetch with timeout and better error handling
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout = 15000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your connection.', 408);
    }
    throw new ApiError('Unable to connect. Please check your internet.', 0);
  }
};

// Get all posts
export const fetchPosts = async (): Promise<Post[]> => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/posts`, { method: 'GET' });
    if (!response.ok) {
      throw new ApiError('Failed to fetch posts', response.status);
    }
    const posts = await response.json();
    if (!Array.isArray(posts)) {
      throw new ApiError('Invalid response from server');
    }
    return posts;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error fetching posts:', error);
    throw new ApiError('Failed to load posts. Please try again.');
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
    const response = await fetchWithTimeout(`${API_URL}/posts`, {
      method: 'POST',
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'Failed to create post', response.status);
    }
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error creating post:', error);
    throw new ApiError('Failed to create post. Please try again.');
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
    const response = await fetchWithTimeout(`${API_URL}/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify({ content: sanitizedContent, authorId: Number(authorId) }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'Failed to update post', response.status);
    }
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error updating post:', error);
    throw new ApiError('Failed to update post. Please try again.');
  }
};

// Delete a post
export const deletePost = async (postId: number, authorId: number): Promise<void> => {
  try {
    const response = await fetchWithTimeout(
      `${API_URL}/posts/${postId}?authorId=${Number(authorId)}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'Failed to delete post', response.status);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error deleting post:', error);
    throw new ApiError('Failed to delete post. Please try again.');
  }
};

// Like/Unlike a post with rate limiting
export const togglePostLike = async (postId: number, userId: number): Promise<Post> => {
  if (!checkRateLimit('like')) {
    throw new ApiError("You're liking too fast! Please slow down.", 429, true);
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}/posts/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId: Number(userId) }),
    });

    if (!response.ok) {
      throw new ApiError('Failed to toggle like', response.status);
    }
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error toggling post like:', error);
    throw new ApiError('Failed to update like. Please try again.');
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
    const response = await fetchWithTimeout(`${API_URL}/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        author: {
          id: Number(author.id),
          name: sanitizeText(author.name, 100),
          profilePictureUrl: author.profilePictureUrl,
        },
        text: sanitizedText,
      }),
    });

    if (!response.ok) {
      throw new ApiError('Failed to add comment', response.status);
    }
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error adding comment:', error);
    throw new ApiError('Failed to add comment. Please try again.');
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
    const response = await fetchWithTimeout(
      `${API_URL}/posts/${postId}/comments/${commentId}/like`,
      {
        method: 'POST',
        body: JSON.stringify({ userId: Number(userId) }),
      }
    );

    if (!response.ok) {
      throw new ApiError('Failed to toggle comment like', response.status);
    }
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error toggling comment like:', error);
    throw new ApiError('Failed to update like. Please try again.');
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
    const response = await fetchWithTimeout(
      `${API_URL}/posts/${postId}/comments/${commentId}/replies`,
      {
        method: 'POST',
        body: JSON.stringify({
          author: {
            id: Number(author.id),
            name: sanitizeText(author.name, 100),
            profilePictureUrl: author.profilePictureUrl,
          },
          text: sanitizedText,
        }),
      }
    );

    if (!response.ok) {
      throw new ApiError('Failed to add reply', response.status);
    }
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error adding reply:', error);
    throw new ApiError('Failed to add reply. Please try again.');
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
    const response = await fetchWithTimeout(
      `${API_URL}/posts/${postId}/comments/${commentId}/replies/${replyId}/like`,
      {
        method: 'POST',
        body: JSON.stringify({ userId: Number(userId) }),
      }
    );

    if (!response.ok) {
      throw new ApiError('Failed to toggle reply like', response.status);
    }
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error toggling reply like:', error);
    throw new ApiError('Failed to update like. Please try again.');
  }
};
