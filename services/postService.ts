import type { Post, Comment, CommentReply } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper for fetch with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Get all posts
export const fetchPosts = async (): Promise<Post[]> => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/posts`);
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// Create a new post
export const createPost = async (
  author: { id: number; name: string; profilePictureUrl?: string },
  content: string,
  imageUrl?: string
): Promise<Post> => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content, imageUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create post');
    }
    return response.json();
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Update a post
export const updatePost = async (
  postId: number,
  content: string,
  authorId: number
): Promise<Post> => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, authorId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update post');
    }
    return response.json();
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId: number, authorId: number): Promise<void> => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/posts/${postId}?authorId=${authorId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete post');
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Like/Unlike a post
export const togglePostLike = async (postId: number, userId: number): Promise<Post> => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to toggle like');
    }
    return response.json();
  } catch (error) {
    console.error('Error toggling post like:', error);
    throw error;
  }
};

// Add a comment
export const addComment = async (
  postId: number,
  author: { id: number; name: string; profilePictureUrl?: string },
  text: string
): Promise<Comment> => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text }),
    });

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }
    return response.json();
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Like/Unlike a comment
export const toggleCommentLike = async (
  postId: number,
  commentId: number,
  userId: number
): Promise<Comment> => {
  try {
    const response = await fetchWithTimeout(
      `${API_URL}/posts/${postId}/comments/${commentId}/like`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to toggle comment like');
    }
    return response.json();
  } catch (error) {
    console.error('Error toggling comment like:', error);
    throw error;
  }
};

// Add a reply to a comment
export const addReply = async (
  postId: number,
  commentId: number,
  author: { id: number; name: string; profilePictureUrl?: string },
  text: string
): Promise<CommentReply> => {
  try {
    const response = await fetchWithTimeout(
      `${API_URL}/posts/${postId}/comments/${commentId}/replies`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add reply');
    }
    return response.json();
  } catch (error) {
    console.error('Error adding reply:', error);
    throw error;
  }
};

// Like/Unlike a reply
export const toggleReplyLike = async (
  postId: number,
  commentId: number,
  replyId: number,
  userId: number
): Promise<CommentReply> => {
  try {
    const response = await fetchWithTimeout(
      `${API_URL}/posts/${postId}/comments/${commentId}/replies/${replyId}/like`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to toggle reply like');
    }
    return response.json();
  } catch (error) {
    console.error('Error toggling reply like:', error);
    throw error;
  }
};
