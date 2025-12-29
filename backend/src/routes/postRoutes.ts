import express from 'express';
import { db } from '../db';
import type { Post, Comment, CommentReply } from '../types';

const router = express.Router();

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
router.post('/', (req, res) => {
  try {
    const { author, content, imageUrl } = req.body;

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
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

// Update a post
router.put('/:id', (req, res) => {
  try {
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const { content, authorId } = req.body;
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
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }

    db.posts[postIndex] = { ...db.posts[postIndex], content: sanitizedContent };
    res.json(db.posts[postIndex]);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
});

// Delete a post
router.delete('/:id', (req, res) => {
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
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    db.posts.splice(postIndex, 1);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

// Like/Unlike a post
router.post('/:id/like', (req, res) => {
  try {
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const userId = validateId(req.body.userId);
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

    res.json(post);
  } catch (error) {
    console.error('Error toggling post like:', error);
    res.status(500).json({ message: 'Failed to toggle like' });
  }
});

// Add a comment to a post
router.post('/:id/comments', (req, res) => {
  try {
    const postId = validateId(req.params.id);
    if (!postId) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const { author, text } = req.body;
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
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// Like/Unlike a comment
router.post('/:postId/comments/:commentId/like', (req, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);
    const userId = validateId(req.body.userId);

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

    res.json(comment);
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ message: 'Failed to toggle like' });
  }
});

// Add a reply to a comment
router.post('/:postId/comments/:commentId/replies', (req, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);

    if (!postId || !commentId) {
      return res.status(400).json({ message: 'Invalid post or comment ID' });
    }

    const { author, text } = req.body;
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
    res.status(201).json(newReply);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Failed to add reply' });
  }
});

// Like/Unlike a reply
router.post('/:postId/comments/:commentId/replies/:replyId/like', (req, res) => {
  try {
    const postId = validateId(req.params.postId);
    const commentId = validateId(req.params.commentId);
    const replyId = validateId(req.params.replyId);
    const userId = validateId(req.body.userId);

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

    res.json(reply);
  } catch (error) {
    console.error('Error toggling reply like:', error);
    res.status(500).json({ message: 'Failed to toggle like' });
  }
});

export default router;
